// GET  /api/ask?q=your question      (easy to test in a browser)
// POST /api/ask  { "question": "..." }
// Thin wrapper: the pipeline itself lives in lib/rag.js (shared with evals).
import { answerQuestion } from '../lib/rag.js'

// ── Rate limiting ─────────────────────────────────────────────
// If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, uses
// Upstash Redis (durable, shared across all serverless instances).
// Otherwise falls back to per-instance in-memory sliding window.
let _ratelimit = null

async function getRatelimit() {
  if (_ratelimit !== null) return _ratelimit
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis }     = await import('@upstash/redis')
      const redis = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      _ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(8, '60 s'),
        prefix: 'physio:ask',
      })
      return _ratelimit
    } catch (e) {
      console.warn('Upstash init failed, using in-memory fallback:', e.message)
    }
  }
  _ratelimit = false   // signal: use in-memory
  return false
}

const hits = new Map()
function memLimited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 8
}

async function isLimited(ip) {
  const rl = await getRatelimit()
  if (rl) {
    const { success } = await rl.limit(ip)
    return !success
  }
  return memLimited(ip)
}
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const q = String((req.method === 'POST' ? req.body?.question : req.query.q) || '').trim().slice(0, 500)
  if (!q) return res.status(400).json({ error: 'Ask a question, e.g. /api/ask?q=knee pain on stairs' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (await isLimited(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })

  try {
    const r = await answerQuestion(q)
    const body = { refused: r.refused, answer: r.answer, citations: r.citations, session: r.session }
    if (r.refused) body.reason = r.reason
    if (r.model) body.model = r.model
    res.status(200).json(body)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
