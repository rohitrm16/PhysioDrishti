// Tools the agent can call. The model chooses WHICH tool and WHEN; the server
// enforces the rules (slot availability, contact details, one booking per turn).
import { admin } from './db.js'
import { embedQuery } from './gemini.js'
import { hasRedFlag, asksAboutMedication, RED_FLAG_MESSAGE } from './safety.js'
import { maskPii } from './pii.js'

const MIN_SIM = Number(process.env.MIN_SIMILARITY ?? 0.55)
const TZ = 'Asia/Kolkata'

export const TOOL_DEFS = [
  {
    name: 'search_knowledge',
    description: 'Search the PhysioDrishti patient-education articles. Call this before answering any health, treatment or service question.',
    schema: { type: 'object', properties: { query: { type: 'string', description: 'Search query in English' } }, required: ['query'] },
  },
  {
    name: 'check_red_flags',
    description: 'Check symptoms the patient described for warning signs that need urgent medical care. Call this whenever new symptoms are mentioned.',
    schema: { type: 'object', properties: { text: { type: 'string', description: 'The symptoms in the patient words' } }, required: ['text'] },
  },
  {
    name: 'suggest_slots',
    description: 'List up to 3 open consultation slots in the next 7 days.',
    schema: {
      type: 'object',
      properties: {
        day: { type: 'string', description: 'Optional: today, tomorrow, a weekday name such as monday, or YYYY-MM-DD' },
        part_of_day: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'any'] },
      },
    },
  },
  {
    name: 'create_booking',
    description: 'Request a booking for a slot the patient has explicitly chosen. Creates a pending request that a clinician must approve. Never invent slot ids.',
    schema: {
      type: 'object',
      properties: {
        slot_id: { type: 'integer', description: 'slot_id from suggest_slots' },
        summary: { type: 'string', description: 'One sentence on the concern, without personal details' },
      },
      required: ['slot_id', 'summary'],
    },
  },
]

function istParts(date) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'long' })
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]))
  return { ymd: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday.toLowerCase() }
}

export function formatSlot(iso) {
  return new Date(iso).toLocaleString('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function matchesDay(date, day) {
  if (!day) return true
  const d = String(day).toLowerCase().trim()
  const slot = istParts(date)
  const today = istParts(new Date())
  const tomorrow = istParts(new Date(Date.now() + 86400000))
  if (d === 'today') return slot.ymd === today.ymd
  if (d === 'tomorrow') return slot.ymd === tomorrow.ymd
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return slot.ymd === d
  return slot.weekday.startsWith(d.slice(0, 3))
}

function matchesPart(date, part) {
  if (!part || part === 'any') return true
  const h = istParts(date).hour
  if (part === 'morning') return h < 12
  if (part === 'afternoon') return h >= 12 && h < 17
  return h >= 17
}

// Staff must respond within 4 hours, or 2 hours before the slot, whichever is sooner (min 15 minutes).
export function approvalDeadline(startsAt, now = Date.now()) {
  const t = Math.min(now + 4 * 3600e3, new Date(startsAt).getTime() - 2 * 3600e3)
  return new Date(Math.max(t, now + 15 * 60e3)).toISOString()
}

// ctx: { session, contact, channel, sources: [], booking: null }
export async function runTool(name, args, ctx) {
  if (name === 'search_knowledge') {
    const query = maskPii(String(args.query || '')).slice(0, 300)
    if (!query) return { results: [], note: 'Empty query' }
    const vec = await embedQuery(query)
    const { data, error } = await admin.rpc('match_chunks', { query_embedding: JSON.stringify(vec), match_count: 4, min_similarity: MIN_SIM })
    if (error) throw error
    const results = (data || []).map((h) => {
      const title = h.metadata?.title || 'Source'
      if (!ctx.sources.find((s) => s.chunk_id === h.id)) {
        ctx.sources.push({ chunk_id: h.id, document_id: h.document_id, title, similarity: Number(Number(h.similarity).toFixed(3)) })
      }
      return { title, similarity: Number(Number(h.similarity).toFixed(3)), text: String(h.content).slice(0, 900) }
    })
    return results.length ? { results } : { results: [], note: 'Nothing relevant found. Say you do not have reliable information and suggest a free call.' }
  }

  if (name === 'check_red_flags') {
    const text = String(args.text || '')
    const flagged = hasRedFlag(text)
    return { flagged, medication_question: asksAboutMedication(text), instruction: flagged ? 'Stop. Tell the patient exactly: ' + RED_FLAG_MESSAGE : 'No red flags found.' }
  }

  if (name === 'suggest_slots') {
    const from = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
    const to = new Date(Date.now() + 8 * 86400 * 1000).toISOString()
    const { data, error } = await admin.from('slots').select('id, starts_at, mode')
      .eq('status', 'open').gte('starts_at', from).lte('starts_at', to).order('starts_at').limit(100)
    if (error) throw error
    const picked = (data || []).filter((s) => matchesDay(new Date(s.starts_at), args.day) && matchesPart(new Date(s.starts_at), args.part_of_day)).slice(0, 3)
    if (!picked.length) return { slots: [], note: 'No open slots match. Offer other days or times.' }
    return { slots: picked.map((s) => ({ slot_id: s.id, when: formatSlot(s.starts_at), mode: s.mode })) }
  }

  if (name === 'create_booking') {
    if (ctx.booking) return { ok: false, error: 'already_booked', booking_id: ctx.booking.id }
    if (!ctx.contact?.phone) {
      return { ok: false, error: 'contact_required', instruction: 'Ask the patient to type their name and WhatsApp number in the contact box on screen, then try again. Do not ask them to say or type the number in the chat.' }
    }
    const slotId = Number(args.slot_id)
    const { data: held, error: holdErr } = await admin.from('slots').update({ status: 'held' })
      .eq('id', slotId).eq('status', 'open').select('id, starts_at, mode')
    if (holdErr) throw holdErr
    if (!held?.length) return { ok: false, error: 'slot_unavailable', instruction: 'That slot is no longer available. Call suggest_slots again.' }
    const slot = held[0]
    const { data: rows, error: insErr } = await admin.from('agent_bookings').insert({
      slot_id: slot.id,
      patient_summary: maskPii(String(args.summary || '')).slice(0, 300) || 'Not provided',
      status: 'pending_approval',
      contact_name: ctx.contact.name || null,
      contact_phone: ctx.contact.phone,
      mode: slot.mode,
      source: ctx.channel,
      session_id: ctx.session,
      expires_at: approvalDeadline(slot.starts_at),
    }).select('id')
    if (insErr) {
      await admin.from('slots').update({ status: 'open' }).eq('id', slot.id)
      throw insErr
    }
    ctx.booking = { id: rows[0].id, when: formatSlot(slot.starts_at), mode: slot.mode, status: 'pending_approval' }
    return { ok: true, booking_id: rows[0].id, when: ctx.booking.when, status: 'pending_approval', instruction: 'Tell the patient the request is sent and a clinician will confirm on WhatsApp.' }
  }

  return { error: 'unknown_tool' }
}
