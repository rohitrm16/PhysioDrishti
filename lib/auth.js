import crypto from 'node:crypto'

function parseCookies(header) {
  const out = {}
  for (const part of String(header || '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k) out[k.trim()] = decodeURIComponent(v.join('=').trim())
  }
  return out
}

// Checks in order: x-admin-key header, body.key, eval_session cookie.
// ?key= in the URL is accepted only to BOOTSTRAP the cookie on the first
// browser visit; it must not be forwarded in subsequent redirect URLs.
export function isAuthorised(req) {
  const real = String(process.env.EVAL_SECRET || process.env.INGEST_SECRET || '')
  if (!real) return false

  const candidates = [
    req.headers?.['x-admin-key'],
    req.body?.key,
    req.query?.key,                          // bootstrap only — first request
    parseCookies(req.headers?.cookie).eval_session,
  ]

  for (const given of candidates) {
    if (!given) continue
    const g = String(given)
    if (g.length !== real.length) continue
    try {
      if (crypto.timingSafeEqual(Buffer.from(g), Buffer.from(real))) return true
    } catch {}
  }
  return false
}

// Call this once after the first successful auth check in a browser-based
// flow. The cookie carries auth for all subsequent meta-refresh redirects,
// so the secret never appears in redirect URLs or browser history.
export function setEvalSessionCookie(res, secret) {
  res.setHeader('Set-Cookie',
    `eval_session=${encodeURIComponent(secret)}; HttpOnly; Secure; SameSite=Lax; Max-Age=3600; Path=/api/`)
}
