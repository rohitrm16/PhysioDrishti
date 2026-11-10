// GET /api/traces               -> recent sessions (staff only)
// GET /api/traces?session=UUID  -> every step of one session
// Requires a Supabase login token from an email listed in STAFF_EMAILS.
import { admin } from '../lib/db.js'
import { requireStaff } from '../lib/staffAuth.js'

function summarise(rows, titles) {
  const steps = [...rows].sort((a, b) => a.step - b.step)
  const first = steps[0] || {}
  const q = steps.find((s) => s.input?.question)?.input?.question || steps.find((s) => s.tool === 'stt')?.output?.transcript || ''
  const final = steps.find((s) => s.tool === 'final')
  const sources = []
  for (const s of steps) {
    for (const h of s.output?.hits || []) {
      const title = h.title || titles[h.document_id] || `doc ${h.document_id}`
      if (!sources.find((x) => x.title === title)) sources.push({ title, similarity: h.similarity })
    }
  }
  const num = (k) => steps.reduce((a, s) => a + (Number(s[k]) || 0), 0)
  return {
    session_id: first.session_id,
    started_at: steps.reduce((m, s) => (s.created_at < m ? s.created_at : m), first.created_at),
    channel: steps.find((s) => s.input?.channel)?.input?.channel || (steps.some((s) => s.tool === 'retrieve') ? 'ask' : 'unknown'),
    question: q,
    final_answer: final?.output?.reply || final?.output?.answer || null,
    refused: final?.output?.refused ?? null,
    reason: final?.output?.reason ?? null,
    booking_id: final?.output?.booking_id ?? null,
    sources,
    tools: steps.map((s) => s.tool),
    models: [...new Set(steps.map((s) => s.model).filter(Boolean))],
    step_count: steps.length,
    latency_ms: num('latency_ms'),
    tokens_in: num('tokens_in'),
    tokens_out: num('tokens_out'),
    cost_usd: num('cost_usd'),
  }
}

export default async function handler(req, res) {
  const staff = await requireStaff(req)
  if (!staff) return res.status(401).json({ error: 'Staff login required' })

  try {
    const { data: docs } = await admin.from('documents').select('id, title')
    const titles = Object.fromEntries((docs || []).map((d) => [d.id, d.title]))

    if (req.query.session) {
      const { data, error } = await admin.from('agent_traces').select('*').eq('session_id', String(req.query.session)).order('step')
      if (error) throw error
      if (!data.length) return res.status(404).json({ error: 'Session not found' })
      return res.status(200).json({ summary: summarise(data, titles), steps: data })
    }

    const { data, error } = await admin.from('agent_traces').select('*').order('created_at', { ascending: false }).limit(800)
    if (error) throw error
    const groups = new Map()
    for (const r of data) {
      if (!groups.has(r.session_id)) groups.set(r.session_id, [])
      groups.get(r.session_id).push(r)
    }
    const sessions = [...groups.values()].map((rows) => summarise(rows, titles))
      .sort((a, b) => (a.started_at < b.started_at ? 1 : -1)).slice(0, 50)
    res.status(200).json({ sessions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err.message || err) })
  }
}
