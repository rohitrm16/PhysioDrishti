// GET  /api/ask?q=your question      (easy to test in a browser)
// POST /api/ask  { "question": "..." }
// Thin wrapper: the pipeline itself lives in lib/rag.js (shared with evals).
import { answerQuestion } from '../lib/rag.js'

// Best-effort rate limit (in-memory, per server instance)
const hits = new Map()
function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 8
}

export default async function handler(req, res) {
  const q = String((req.method === 'POST' ? req.body?.question : req.query.q) || '').trim().slice(0, 500)
  if (!q) return res.status(400).json({ error: 'Ask a question, e.g. /api/ask?q=knee pain on stairs' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })

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
