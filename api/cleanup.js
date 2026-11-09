// Deletes agent_traces rows older than 30 days.
// Called by the Vercel cron (see vercel.json). Vercel sends
// Authorization: Bearer <CRON_SECRET> on every cron invocation.
import { admin } from '../lib/db.js'

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET || ''
  const auth = req.headers.authorization || ''
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { error, count } = await admin
    .from('agent_traces')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff)

  if (error) {
    console.error('cleanup error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  console.log(`cleanup: deleted ${count} trace rows older than ${cutoff}`)
  return res.status(200).json({ deleted: count, cutoff })
}
