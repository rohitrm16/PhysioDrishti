// Tool-calling agent. The LLM decides which tools to call; the code enforces safety:
//  - a rule-based red-flag/medication guard runs BEFORE the LLM (cannot be skipped)
//  - personal details are masked before the LLM sees them
//  - contact details reach create_booking server-side only, never through the LLM
import { createChat, PROVIDER } from './llm.js'
import { TOOL_DEFS, runTool } from './tools.js'
import { hasRedFlag, RED_FLAG_MESSAGE, asksAboutMedication, MEDICATION_MESSAGE } from './safety.js'
import { maskPii, isIndianMobile } from './pii.js'
import { createTracer } from './tracer.js'

const MAX_STEPS = 6
const LANGS = { 'en-IN': 'English', 'hi-IN': 'Hindi', 'kn-IN': 'Kannada', 'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi', 'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi', 'od-IN': 'Odia' }
const FALLBACK = 'Sorry, I could not complete that. Please book a free call and our physiotherapist will help.'

function systemPrompt(language, channel) {
  return [
    'You are Drishti, the booking and information assistant for PhysioDrishti, a physiotherapy service in Bengaluru.',
    'Always call search_knowledge before answering a health, treatment or service question, and answer only from what it returns.',
    'If search_knowledge finds nothing relevant, say you do not have reliable information and suggest a free call.',
    'When the patient describes symptoms, call check_red_flags. If it is flagged, give its message and stop.',
    'Never diagnose, never suggest medicines or doses, never promise outcomes.',
    'To book: call suggest_slots, offer at most 3 options, and call create_booking only after the patient clearly picks one.',
    'Never ask for phone numbers in the conversation. If create_booking says contact_required, ask the patient to fill in the contact box on screen.',
    'Do not describe yourself or mention that you are an AI.',
    channel === 'voice'
      ? 'Your reply is spoken aloud: plain sentences only, no lists, no markdown, no citation numbers, under 70 words.'
      : 'Keep replies under 120 words. No markdown headings.',
    `Reply in ${LANGS[language] || 'English'}.`,
  ].join(' ')
}

export async function runAgent({ message, history = [], contact = null, language = 'en-IN', channel = 'agent', tracer = createTracer(), provider = PROVIDER }) {
  const started = Date.now()
  const q = maskPii(String(message || '').trim().slice(0, 500))
  const phone = contact?.phone && isIndianMobile(contact.phone) ? String(contact.phone).trim() : null
  const ctx = { session: tracer.session, channel, sources: [], booking: null, contact: phone ? { phone, name: String(contact.name || '').slice(0, 60) || null } : null }
  let tokensIn = 0, tokensOut = 0, cost = 0, model = null

  async function finish(reply, refused = false, reason = null) {
    const t = Date.now()
    const citations = [...new Map(ctx.sources.map((s) => [s.document_id, { title: s.title, document_id: s.document_id }])).values()]
    await tracer.log('final', { channel }, { reply, refused, reason, citations, booking_id: ctx.booking?.id || null }, t)
    return {
      session: tracer.session, question: q, reply, refused, reason, citations, sources: ctx.sources,
      booking: ctx.booking, model, tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: cost,
      latency_ms: Math.round(Date.now() - started), steps: tracer.steps,
    }
  }

  // 1. Deterministic safety guard (runs before any model call)
  let t = Date.now()
  const flagged = hasRedFlag(q)
  const medication = asksAboutMedication(q)
  await tracer.log('check_red_flags', { question: q, channel, language, contact_present: Boolean(ctx.contact), guard: true }, { flagged, medication }, t)
  if (flagged) return finish(RED_FLAG_MESSAGE, true, 'red_flag')
  if (medication) return finish(MEDICATION_MESSAGE, true, 'medication')

  // 2. Agent loop
  const chat = createChat({ system: systemPrompt(language, channel), tools: TOOL_DEFS, provider })
  chat.addHistory(history.map((h) => ({ role: h.role, text: maskPii(h.text || '') })))
  chat.addUser(q)

  for (let i = 0; i < MAX_STEPS; i++) {
    t = Date.now()
    const r = await chat.step()
    model = r.model
    tokensIn += r.tokensIn; tokensOut += r.tokensOut
    if (r.costUsd !== null && r.costUsd !== undefined) cost += r.costUsd
    await tracer.log('llm', { provider, turn: i + 1 }, { tool_calls: r.calls.map((c) => c.name), text_chars: r.text.length }, t, {
      model: r.model, tokens_in: r.tokensIn, tokens_out: r.tokensOut, cost_usd: r.costUsd,
    })

    if (!r.calls.length) {
      const reply = r.text.trim()
      return reply ? finish(reply) : finish(FALLBACK, true, 'empty_reply')
    }

    const results = []
    for (const call of r.calls) {
      t = Date.now()
      let result
      try { result = await runTool(call.name, call.args, ctx) } catch (err) { result = { error: 'tool_failed', detail: String(err.message || err).slice(0, 200) } }
      const loggedArgs = JSON.parse(maskPii(JSON.stringify(call.args || {})))
      const summary = call.name === 'search_knowledge'
        ? { hits: (result.results || []).map((x) => ({ title: x.title, similarity: x.similarity })) }
        : result
      await tracer.log(call.name, loggedArgs, summary, t)
      results.push({ id: call.id, name: call.name, result })
      if (call.name === 'check_red_flags' && result.flagged) return finish(RED_FLAG_MESSAGE, true, 'red_flag')
    }
    chat.addToolResults(results)
  }
  return finish(FALLBACK, true, 'max_steps')
}
