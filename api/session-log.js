// POST /api/session-log  — anonymous summary of a finished guided session.
// Stores no names, phone numbers or video: a random device id, reps done and pain scores only.
import { admin } from '../lib/db.js'
import { CONDITIONS } from '../lib/exercises.js'
import { isRateLimited, clientIp } from '../lib/limit.js'

const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (await isRateLimited('slog:' + clientIp(req), 6)) return res.status(429).json({ error: 'Too many requests' })
  const b = req.body || {}
  const device_id = String(b.device_id || '').slice(0, 64)
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(device_id)) return res.status(400).json({ error: 'bad device_id' })
  if (!CONDITIONS[b.condition]) return res.status(400).json({ error: 'bad condition' })
  const mode = ['follow', 'camera', 'mixed'].includes(b.mode) ? b.mode : 'follow'
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 8).map((i) => ({
    slug: String(i.slug || '').slice(0, 40), target: int(i.target, 0, 200) ?? 0, done: int(i.done, 0, 200) ?? 0,
  }))
  const { error } = await admin.from('exercise_sessions').insert({
    device_id, condition: b.condition, mode, items,
    pain_before: int(b.pain_before, 0, 10), pain_after: int(b.pain_after, 0, 10),
    stopped_for_pain: Boolean(b.stopped_for_pain), duration_s: int(b.duration_s, 0, 7200),
  })
  if (error) { console.error(error); return res.status(500).json({ error: 'Could not save' }) }
  return res.status(200).json({ ok: true })
}
