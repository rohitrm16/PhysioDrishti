// GET /api/exercises?condition=knee_osteoarthritis
// Approved, guideline-based home exercises for a guided session. Drafts are never returned.
// The patient answers a safety screen in the app before this is called.
import { getHomeExercises, CONDITIONS } from '../lib/exercises.js'
import { isRateLimited, clientIp } from '../lib/limit.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })
  if (await isRateLimited('ex:' + clientIp(req), 20)) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' })
  const condition = String(req.query.condition || '')
  if (!CONDITIONS[condition]) return res.status(400).json({ error: 'unknown condition', supported: Object.keys(CONDITIONS) })
  try {
    const r = await getHomeExercises(condition, '')
    res.setHeader('Cache-Control', 'public, max-age=60')
    if (!r.ok) return res.status(200).json({ ok: false, condition, label: CONDITIONS[condition].label, reason: r.error })
    const { instruction, ...rest } = r
    return res.status(200).json(rest)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Could not load exercises' })
  }
}
