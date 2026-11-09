// POST/GET /api/ingest?key=YOUR_INGEST_SECRET[&limit=3][&reindex=1]
// Chunks documents that have no chunks yet, embeds them with Gemini,
// and stores them in the chunks table. Call repeatedly until remaining = 0.
import crypto from 'node:crypto'
import { admin } from '../lib/db.js'
import { embedDocuments } from '../lib/gemini.js'
import { chunkText } from '../lib/chunk.js'

function authorised(req) {
  const given = String(req.query.key || req.headers['x-ingest-secret'] || '')
  const real = String(process.env.INGEST_SECRET || '')
  if (!real || given.length !== real.length) return false
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(real))
}

export default async function handler(req, res) {
  if (!authorised(req)) return res.status(401).json({ error: 'unauthorised' })

  const limit = Math.min(Number(req.query.limit) || 3, 10)

  try {
    if (req.query.reindex === '1') {
      const { error } = await admin.from('chunks').delete().gte('id', 0)
      if (error) throw error
    }

    const { data: docs, error: e1 } = await admin
      .from('documents').select('id,title,content').order('id')
    if (e1) throw e1

    const { data: done, error: e2 } = await admin.from('chunks').select('document_id')
    if (e2) throw e2

    const doneIds = new Set((done || []).map((c) => c.document_id))
    const todo = docs.filter((d) => !doneIds.has(d.id))
    const batch = todo.slice(0, limit)

    let created = 0
    for (const d of batch) {
      const parts = chunkText(d.content)
      const vecs = await embedDocuments(parts)
      const rows = parts.map((content, i) => ({
        document_id: d.id,
        content,
        embedding: JSON.stringify(vecs[i]),
        metadata: { title: d.title, chunk_index: i },
      }))
      const { error } = await admin.from('chunks').insert(rows)
      if (error) throw error
      created += rows.length
    }

    res.status(200).json({
      processed_documents: batch.length,
      chunks_created: created,
      remaining_documents: todo.length - batch.length,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err.message || err) })
  }
}
