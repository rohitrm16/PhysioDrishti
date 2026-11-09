// GET  /api/ask?q=your question      (easy to test in a browser)
// POST /api/ask  { "question": "..." }
//
// Agent steps, each logged to agent_traces:
//   1 check_red_flags -> 2 embed_query -> 3 retrieve -> 4 generate
import crypto from 'node:crypto'
import { admin } from '../lib/db.js'
import { embedQuery, generate, costUsd, GEN_MODEL, EMBED_MODEL } from '../lib/gemini.js'

import { hasRedFlag, RED_FLAG_MESSAGE, asksAboutMedication, MEDICATION_MESSAGE } from '../lib/safety.js'

const MIN_SIM = Number(process.env.MIN_SIMILARITY ?? 0.55)

const SYSTEM = [
  'You are Drishti, an information assistant for PhysioDrishti, a physiotherapy service in Bengaluru.',
  'Answer ONLY using the numbered sources provided.',
  'If the sources do not answer the question, reply with exactly: INSUFFICIENT',
  'Never diagnose, never suggest medication or doses, never promise outcomes.',
  'Use plain language, under 150 words, and cite sources like [1] or [2].',
  'Finish with one short line suggesting a free call, or a doctor if symptoms are severe or worsening.',
  'You are an AI assistant, not a clinician.',
].join(' ')

const NO_ANSWER =
  "I don't have reliable information on that. Please book a free call and our physiotherapist will help."

// Best-effort rate limit (in-memory, per server instance)
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 8
}

async function trace(session_id, step, tool, input, output, started, extra = {}) {
  const { error } = await admin.from('agent_traces').insert({
    session_id, step, tool, input, output,
    latency_ms: Math.round(Date.now() - started),
    ...extra,
  })
  if (error) console.error('trace insert failed:', error.message)
}

export default async function handler(req, res) {
  const q = String((req.method === 'POST' ? req.body?.question : req.query.q) || '')
    .trim().slice(0, 500)
  if (!q) return res.status(400).json({ error: 'Ask a question, e.g. /api/ask?q=knee pain on stairs' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })

  const session = crypto.randomUUID()
  let step = 0

  try {
    // 1. Safety screen (rule-based, no AI)
    let t = Date.now()
    const flagged = hasRedFlag(q)
    await trace(session, ++step, 'check_red_flags', { question: q }, { flagged }, t)
    if (flagged) {
      return res.status(200).json({ refused: true, reason: 'red_flag', answer: RED_FLAG_MESSAGE, citations: [], session })
    }

    // 2. Embed the question
    t = Date.now()
    const vec = await embedQuery(q)
    await trace(session, ++step, 'embed_query', { chars: q.length }, { dims: vec.length }, t, { model: EMBED_MODEL })

    // 3. Retrieve similar chunks
    t = Date.now()
    const { data: found, error } = await admin.rpc('match_chunks', {
      query_embedding: JSON.stringify(vec),
      match_count: 5,
      min_similarity: MIN_SIM,
    })
    if (error) throw error
    await trace(session, ++step, 'retrieve', { min_similarity: MIN_SIM }, {
      hits: found.map((h) => ({ chunk_id: h.id, document_id: h.document_id, similarity: Number(h.similarity.toFixed(3)) })),
    }, t)

    if (!found.length) {
      return res.status(200).json({ refused: true, reason: 'low_confidence', answer: NO_ANSWER, citations: [], session })
    }

    // 4. Generate a grounded answer
    t = Date.now()
    const sources = found
      .map((h, i) => `[${i + 1}] (${h.metadata?.title || 'Source'})\n${h.content}`)
      .join('\n\n')
    const out = await generate(SYSTEM, `Sources:\n${sources}\n\nQuestion: ${q}`)
    const cost = costUsd(out.tokensIn, out.tokensOut)
    await trace(session, ++step, 'generate', { sources: found.length }, { chars: out.text.length }, t, {
      model: GEN_MODEL, tokens_in: out.tokensIn, tokens_out: out.tokensOut, cost_usd: cost,
    })

    if (/^\s*INSUFFICIENT/i.test(out.text)) {
      return res.status(200).json({ refused: true, reason: 'no_answer', answer: NO_ANSWER, citations: [], session })
    }

    const cited = [...new Set([...out.text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))]
    const citations = cited
      .filter((n) => n >= 1 && n <= found.length)
      .map((n) => ({ n, title: found[n - 1].metadata?.title, document_id: found[n - 1].document_id }))

    res.status(200).json({ refused: false, answer: out.text.trim(), citations, session, model: GEN_MODEL })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
