// Verifies a Supabase JWT from the Authorization: Bearer header,
// then checks the user's email against the STAFF_EMAILS allowlist.
// Returns { email, user } on success, null on failure.
import { admin } from './db.js'

const ALLOWLIST = new Set(
  String(process.env.STAFF_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
)

export async function requireStaff(req) {
  const auth = String(req.headers?.authorization || '')
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  if (!token) return null

  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null

  const email = (user.email || '').toLowerCase()
  if (ALLOWLIST.size > 0 && !ALLOWLIST.has(email)) return null
  return { email, user }
}
