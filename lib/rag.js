// The RAG pipeline used by BOTH /api/ask (patients) and /api/eval (evaluation),
// so evals test exactly the same code path that production runs.
//
// Steps, each logged to agent_traces:
//   1 check_red_flags -> 2 embed_query -> 3 retrieve -> 4 generate
import crypto from 'node:crypto'
import { admin } from './db.js'
import { embedQuery, generate, costUsd, GEN_MODEL, EMBED_MODEL } from './gemini.js'
import { hasRedFlag, RED_FLAG_MESSAGE, asksAboutMedication, MEDICATION_MESSAGE } from './safety.js'
import { maskPii } from './pii.js'

export const MIN_SIM = Number(process.env.MIN_SIMILARITY ?? 0.55)
export const MATCH_COUNT = 5

export const NO_ANSWER =
  "I don't have reliable information on that in my current knowledge base."

const SYSTEM = [
  'You are Drishti, an information assistant for PhysioDrishti.',
  'STRICT RULES — follow every one:',
  '1. Answer ONLY using information that appears verbatim or by clear implication in the numbered sources below.',
  '   Do not add facts, timelines, exercises, or advice from your own training.',
  '2. If the sources do not contain enough information to answer, reply with exactly: INSUFFICIENT',
  '3. Never diagnose a condition, suggest medication or doses, or promise any outcome.',
  '4. Do not add calls to action (booking links, free-call offers, WhatsApp prompts) unless a source explicitly mentions them.',
  '5. If the question describes urgent red-flag symptoms — severe neurological loss, chest pain, signs of DVT, post-surgical infection, stroke — tell the person to seek emergency care immediately.',
  '   Do not pair this with a booking suggestion.',
  '6. Cite every claim with its source number like [1] or [2].',
  '7. Use plain language, under 150 words.',
  '8. You are an AI assistant, not a clinician. Do not act like one.',
].join(' ')

export async function answerQuestion(question) {
  const q = maskPii(String(question || '').trim().slice(0, 500))
  const session = crypto.randomUUID()
  const started = Date.now()
  const toolCalls = []
  let step = 0
  let tokensIn = 0
  let tokensOut = 0
  let cost = 0

  async function log(tool, input, output, t0, extra = {}) {
    const latency_ms = Math.round(Date.now() - t0)
    step += 1
    toolCalls.push({ step, tool, latency_ms, output })
    const safeInput = tool === 'check_red_flags' ? { ...input, question: maskPii(input.question) } : input
    const { error } = await admin.from('agent_traces').insert({
      session_id: session, step, tool, input: safeInput, output, latency_ms, ...extra,
    })
    if (error) console.error('trace insert failed:', error.message)
  }

  function finish(fields) {
    return {
      session, question: q, refused: false, reason: null, answer: '',
      citations: [], retrieved: [], context: '', model: null,
      ...fields,
      tool_calls: toolCalls,
      latency_ms: Math.round(Date.now() - started),
      tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: cost,
    }
  }

  // 1. Rule-based safety screen (no AI)
  let t = Date.now()
  const flagged = hasRedFlag(q)
  const medication = asksAboutMedication(q)
  await log('check_red_flags', { question: q }, { flagged, medication }, t)
  if (flagged) return finish({ refused: true, reason: 'red_flag', answer: RED_FLAG_MESSAGE })
  if (medication) return finish({ refused: true, reason: 'medication', answer: MEDICATION_MESSAGE })

  // 2. Embed the question
  t = Date.now()
  const vec = await embedQuery(q)
  await log('embed_query', { chars: q.length }, { dims: vec.length }, t, { model: EMBED_MODEL })

  // 3. Retrieve similar chunks
  t = Date.now()
  const { data: found, error } = await admin.rpc('match_chunks', {
    query_embedding: JSON.stringify(vec),
    match_count: MATCH_COUNT,
    min_similarity: MIN_SIM,
  })
  if (error) throw error
  const retrieved = found.map((h) => ({
    chunk_id: h.id, document_id: h.document_id, similarity: Number(Number(h.similarity).toFixed(3)),
  }))
  await log('retrieve', { min_similarity: MIN_SIM }, { hits: retrieved }, t)
  if (!found.length) return finish({ refused: true, reason: 'low_confidence', answer: NO_ANSWER })

  // 4. Generate a grounded answer
  t = Date.now()
  const context = found
    .map((h, i) => `[${i + 1}] (${h.metadata?.title || 'Source'})\n${h.content}`)
    .join('\n\n')
  const out = await generate(SYSTEM, `Sources:\n${context}\n\nQuestion: ${q}`)
  tokensIn = out.tokensIn
  tokensOut = out.tokensOut
  cost = costUsd(out.tokensIn, out.tokensOut)
  await log('generate', { sources: found.length }, { chars: out.text.length }, t, {
    model: GEN_MODEL, tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: cost,
  })

  if (/^\s*INSUFFICIENT/i.test(out.text)) {
    return finish({ refused: true, reason: 'no_answer', answer: NO_ANSWER, retrieved, context, model: GEN_MODEL })
  }

  const cited = [...new Set([...out.text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))]
  const citations = cited
    .filter((n) => n >= 1 && n <= found.length)
    .map((n) => ({ n, title: found[n - 1].metadata?.title, document_id: found[n - 1].document_id }))

  return finish({ answer: out.text.trim(), citations, retrieved, context, model: GEN_MODEL })
         }
