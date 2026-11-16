// One endpoint for home-exercise recovery (kept as one file: Vercel Hobby allows 12 functions).
//
// Public (no login; patients are identified only by a random device id):
//   GET  /api/recovery?action=exercises&condition=knee_osteoarthritis   approved exercises only
//   POST /api/recovery { action:'session', device_id, condition, mode, items, pain_before, pain_after, stopped_for_pain, duration_s, rep_scale }
//   POST /api/recovery { action:'goal',    device_id, condition, goal, rating }
//   POST /api/recovery { action:'share',   device_id, name, phone, consent:true }   patient opts in
//   POST /api/recovery { action:'unshare', device_id }                              patient opts out
// Staff only (Supabase login + STAFF_EMAILS):
//   GET  /api/recovery?action=staff     progress of patients who chose to share
import { admin } from '../lib/db.js'
import { getHomeExercises, CONDITIONS } from '../lib/exercises.js'
import { isRateLimited, clientIp } from '../lib/limit.js'
import { isIndianMobile } from '../lib/pii.js'
import { requireStaff } from '../lib/staffAuth.js'
import { adherence, painTrend, goalProgress, flags } from '../src/recovery.js'

const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null)
const validDevice = (d) => /^[a-zA-Z0-9-]{8,64}$/.test(String(d || ''))
const tenDigits = (p) => String(p).replace(/\D/g, '').slice(-10)

export default async function handler(req, res) {
  try {
    const action = String((req.method === 'GET' ? req.query.action : req.body?.action) || '')

    if (req.method === 'GET' && action === 'exercises') {
      if (await isRateLimited('ex:' + clientIp(req), 20)) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' })
      const condition = String(req.query.condition || '')
      if (!CONDITIONS[condition]) return res.status(400).json({ error: 'unknown condition', supported: Object.keys(CONDITIONS) })
      const r = await getHomeExercises(condition, '')
      res.setHeader('Cache-Control', 'public, max-age=60')
      if (!r.ok) return res.status(200).json({ ok: false, condition, label: CONDITIONS[condition].label, reason: r.error })
      const { instruction, ...rest } = r
      return res.status(200).json(rest)
    }

    if (req.method === 'GET' && action === 'staff') {
      const staff = await requireStaff(req)
      if (!staff) return res.status(401).json({ error: 'Staff login required' })
      return res.status(200).json(await staffProgress())
    }

    if (req.method !== 'POST') return res.status(400).json({ error: 'unknown action' })
    if (await isRateLimited('rec:' + clientIp(req), 12)) return res.status(429).json({ error: 'Too many requests' })
    const b = req.body || {}
    if (!validDevice(b.device_id)) return res.status(400).json({ error: 'bad device_id' })
    const device_id = String(b.device_id)

    if (action === 'session') {
      if (!CONDITIONS[b.condition]) return res.status(400).json({ error: 'bad condition' })
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 12).map((i) => ({
        slug: String(i.slug || '').slice(0, 40), target: int(i.target, 0, 200) ?? 0, done: int(i.done, 0, 200) ?? 0,
      }))
      const scale = Number(b.rep_scale)
      const { error } = await admin.from('exercise_sessions').insert({
        device_id, condition: b.condition, mode: ['follow', 'camera', 'mixed'].includes(b.mode) ? b.mode : 'follow', items,
        pain_before: int(b.pain_before, 0, 10), pain_after: int(b.pain_after, 0, 10),
        stopped_for_pain: Boolean(b.stopped_for_pain), duration_s: int(b.duration_s, 0, 7200),
        rep_scale: scale >= 0.25 && scale <= 1 ? scale : null,
      })
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (action === 'goal') {
      const rating = int(b.rating, 0, 10)
      const goal = String(b.goal || '').trim().slice(0, 80)
      if (!CONDITIONS[b.condition] || rating == null || !goal) return res.status(400).json({ error: 'bad goal' })
      const { error } = await admin.from('goal_checkins').insert({ device_id, condition: b.condition, goal, rating })
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (action === 'share') {
      const name = String(b.name || '').trim().slice(0, 60)
      if (!b.consent) return res.status(400).json({ error: 'consent required' })
      if (!name) return res.status(400).json({ error: 'Please enter your name.' })
      if (!isIndianMobile(b.phone)) return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' })
      const { error } = await admin.from('progress_links').upsert({ device_id, name, phone: tenDigits(b.phone), consent_at: new Date().toISOString(), revoked_at: null })
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    if (action === 'unshare') {
      const { error } = await admin.from('progress_links').update({ revoked_at: new Date().toISOString() }).eq('device_id', device_id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'unknown action' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}

// Summaries for the clinician dashboard: only patients who opted in and have not revoked.
async function staffProgress() {
  const { data: links, error } = await admin.from('progress_links').select('*').is('revoked_at', null)
  if (error) throw error
  if (!links.length) return { patients: [] }
  const ids = links.map((l) => l.device_id)
  const since = new Date(Date.now() - 60 * 86400000).toISOString()
  const [{ data: sess, error: e1 }, { data: goals, error: e2 }] = await Promise.all([
    admin.from('exercise_sessions').select('*').in('device_id', ids).gte('created_at', since).order('created_at'),
    admin.from('goal_checkins').select('*').in('device_id', ids).order('created_at'),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const patients = links.map((l) => {
    const s = sess.filter((x) => x.device_id === l.device_id).map((x) => ({
      at: x.created_at, condition: x.condition, pain_before: x.pain_before, pain_after: x.pain_after,
      stopped: x.stopped_for_pain, items: x.items, scale: x.rep_scale == null ? 1 : Number(x.rep_scale), mode: x.mode,
    }))
    const g = goals.filter((x) => x.device_id === l.device_id).map((x) => ({ at: x.created_at, goal: x.goal, rating: x.rating }))
    const a = adherence(s)
    const p = painTrend(s)
    return {
      device_id: l.device_id, name: l.name, phone: l.phone, shared_at: l.consent_at,
      conditions: [...new Set(s.map((x) => CONDITIONS[x.condition]?.label || x.condition))],
      sessions: s.length, last_at: s.length ? s[s.length - 1].at : null,
      adherence: { pct: a.pct, days: a.daysDone, span: a.span, streak: a.streak, week: a.week, daysSinceLast: a.daysSinceLast },
      pain: { first: p.first, last: p.last, change: p.change, points: p.points.slice(-20) },
      goal: goalProgress(g), flags: flags(s, g), recent: s.slice(-8).reverse(),
    }
  })
  const rank = (pt) => (pt.flags.some((f) => f.level === 'danger') ? 0 : pt.flags.some((f) => f.level === 'warn') ? 1 : 2)
  patients.sort((x, y) => rank(x) - rank(y) || +new Date(y.last_at || 0) - +new Date(x.last_at || 0))
  return { patients }
}
