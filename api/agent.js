// POST /api/agent  { message, history?, contact?: {name, phone}, language? }
// Text channel for the tool-calling agent.
import { runAgent } from '../lib/agent.js'
import { isRateLimited, clientIp } from '../lib/limit.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const { message, history, contact, language } = req.body || {}
  if (!String(message || '').trim()) return res.status(400).json({ error: 'message is required' })
  if (await isRateLimited('agent:' + clientIp(req), 10)) return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })

  try {
    const r = await runAgent({ message, history: Array.isArray(history) ? history : [], contact, language: language || 'en-IN', channel: 'agent' })
    res.status(200).json({
      session: r.session, question: r.question, reply: r.reply, refused: r.refused, reason: r.reason,
      citations: r.citations, booking: r.booking, model: r.model,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
