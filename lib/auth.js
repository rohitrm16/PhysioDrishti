import crypto from 'node:crypto'

// Checks ?key= (or x-admin-key header, or body.key) against EVAL_SECRET,
// falling back to INGEST_SECRET so no new variable is strictly required.
export function isAuthorised(req) {
  const given = String(req.query?.key || req.headers?.['x-admin-key'] || req.body?.key || '')
  const real = String(process.env.EVAL_SECRET || process.env.INGEST_SECRET || '')
  if (!real || given.length !== real.length) return false
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(real))
}
