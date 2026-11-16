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

// Validates conversation state sent back by the browser (slots offered in an earlier turn).
// Tampering is harmless: create_booking re-checks that the slot is still open.
function cleanOffered(list) {
  return (Array.isArray(list) ? list : []).slice(0, 5)
    .map((s) => ({ slot_id: Number(s.slot_id), when: String(s.when || '').slice(0, 40), mode: s.mode === 'home' ? 'home' : 'online' }))
    .filter((s) => Number.isInteger(s.slot_id) && s.slot_id > 0)
}

function bookingContext(contactOnFile, offered) {
  const lines = [`Contact details on file: ${contactOnFile ? 'yes. Do not ask for them again.' : 'no.'}`]
  if (offered.length) {
    lines.push('Slots offered earlier in this conversation (use these slot_id values if the patient picks one, e.g. "the first one"):')
    offered.forEach((s, i) => lines.push(`${i + 1}) slot_id ${s.slot_id}: ${s.when}, ${s.mode}`))
  }
  return lines.join(' ')
}

function systemPrompt(language, channel, context = '') {
  return [
    'You are Drishti, the booking and information assistant for PhysioDrishti, a physiotherapy service in Bengaluru.',
    'Always call search_knowledge before answering a health, treatment or service question, and answer only from what it returns.',
    'If search_knowledge finds nothing relevant, say you do not have reliable information and suggest a free call.',
    'When the patient describes symptoms, call check_red_flags. If it is flagged, give its message and stop.',
    'Never diagnose, never suggest medicines or doses, never promise outcomes.',
    'When the patient asks for exercises to do at home, first call check_red_flags on their symptoms, then call get_home_exercises with the closest condition. Never invent exercises or steps yourself; only describe exercises that get_home_exercises returns.',
    'If get_home_exercises returns clearance_required, none_approved or unknown_condition, follow its instruction and offer a session.',
    'When exercises are returned, say they follow Indian national guidelines (ICMR) and were reviewed by our physiotherapist, and that a session gives a personal plan.',
    'To book: call suggest_slots, offer at most 3 options, and call create_booking only after the patient clearly picks one.',
    'Never ask for phone numbers in the conversation. If create_booking says contact_required, ask the patient to fill in the contact box on screen.',
    'Do not describe yourself or mention that you are an AI.',
    channel === 'voice'
      ? 'Your reply is spoken aloud: plain sentences only, no lists, no markdown, no citation numbers, under 70 words. For exercises, explain only the first one slowly and say the rest are on screen.'
      : 'Keep replies under 120 words. No markdown headings.',
    `Reply in ${LANGS[language] || 'English'}.`,
    context,
  ].join(' ')
}

const BOOKING_FAILED = "Sorry, I couldn't complete your booking because of a technical problem on our side. Nothing has been booked yet. Please try again in a few minutes, or tap \"Book a free call\" on the page and our team will call you back."

export async function runAgent({ message, history = [], contact = null, language = 'en-IN', channel = 'agent', state = {}, tracer = null, provider = PROVIDER }) {
  const ownTracer = !tracer
  tracer = tracer || createTracer()
  const started = Date.now()
  const q = maskPii(String(message || '').trim().slice(0, 500))
  const phone = contact?.phone && isIndianMobile(contact.phone) ? String(contact.phone).trim() : null
  const patientText = [...history.filter((h) => h.role === 'user').slice(-4).map((h) => maskPii(h.text || '')), q].join(' \n ')
  const ctx = { session: tracer.session, channel, patientText, sources: [], booking: null, offered: null, exercises: null, contact: phone ? { phone, name: String(contact.name || '').slice(0, 60) || null } : null }
  const previousOffer = cleanOffered(state?.offered_slots)
  let tokensIn = 0, tokensOut = 0, cost = 0, model = null

  async function finish(reply, refused = false, reason = null) {
    const t = Date.now()
    const citations = [...new Map(ctx.sources.map((s) => [s.document_id, { title: s.title, document_id: s.document_id }])).values()]
    const exercises = refused ? null : ctx.exercises
    await tracer.log('final', { channel }, { reply, refused, reason, citations, booking_id: ctx.booking?.id || null, exercises: exercises ? exercises.items.map((e) => e.slug) : null }, t)
    if (ownTracer) await tracer.flush()
    const offered = ctx.booking ? [] : (ctx.offered || previousOffer)
    return {
      state: { offered_slots: offered },
      session: tracer.session, question: q, reply, refused, reason, citations, sources: ctx.sources,
      booking: ctx.booking, exercises, model, tokens_in: tokensIn, tokens_out: tokensOut, cost_usd: cost,
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
  const chat = createChat({ system: systemPrompt(language, channel, bookingContext(Boolean(ctx.contact), previousOffer)), tools: TOOL_DEFS, provider })
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
        : call.name === 'get_home_exercises'
          ? { ok: result.ok, error: result.error || null, condition: result.condition || null, exercises: (result.exercises || []).map((e) => e.slug) }
          : result
      await tracer.log(call.name, loggedArgs, summary, t)
      results.push({ id: call.id, name: call.name, result })
      if (call.name === 'check_red_flags' && result.flagged) return finish(RED_FLAG_MESSAGE, true, 'red_flag')
      if (call.name === 'get_home_exercises' && result.error === 'red_flag') return finish(RED_FLAG_MESSAGE, true, 'red_flag')
      // Never let the model paper over a failed booking: answer with a fixed, honest message.
      if (call.name === 'create_booking' && result.error === 'tool_failed') return finish(BOOKING_FAILED, false, 'booking_failed')
      if (result.error === 'tool_failed') result.instruction = 'This tool failed because of a technical problem. Do not say or imply that it worked. Apologise briefly and offer a free call instead.'
    }
    chat.addToolResults(results)
  }
  return finish(FALLBACK, true, 'max_steps')
}
