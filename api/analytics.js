import crypto from 'crypto'

async function getAccessToken() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')

  const key = JSON.parse(raw)
  // Service account private keys sometimes have escaped newlines when stored as env vars
  const privateKey = key.private_key.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const headerB64  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ].join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url')

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${headerB64}.${payloadB64}`)
  const sig = sign.sign(privateKey, 'base64url')

  const jwt = `${headerB64}.${payloadB64}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) throw new Error(`Token error: ${tokenData.error} — ${tokenData.error_description}`)
  return tokenData.access_token
}

async function fetchGSC(token, siteUrl) {
  const today = new Date()
  const endDate   = today.toISOString().split('T')[0]
  const startDate = new Date(today - 28 * 86400 * 1000).toISOString().split('T')[0]

  const r = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 20,
        orderBy: [{ fieldName: 'impressions', sortOrder: 'DESCENDING' }],
      }),
    }
  )
  if (!r.ok) throw new Error(`GSC ${r.status}: ${await r.text()}`)
  return r.json()
}

async function fetchGA4(token, propertyId) {
  const today = new Date()
  const endDate   = today.toISOString().split('T')[0]
  const startDate = new Date(today - 28 * 86400 * 1000).toISOString().split('T')[0]

  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'bounceRate' },
          { name: 'screenPageViews' },
        ],
        dimensions: [{ name: 'pagePath' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),
    }
  )
  if (!r.ok) throw new Error(`GA4 ${r.status}: ${await r.text()}`)
  return r.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  const configured = !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GSC_SITE_URL &&
    process.env.GA4_PROPERTY_ID
  )

  if (!configured) return res.json({ configured: false })

  try {
    const token = await getAccessToken()
    const [gsc, ga4] = await Promise.all([
      fetchGSC(token, process.env.GSC_SITE_URL),
      fetchGA4(token, process.env.GA4_PROPERTY_ID),
    ])
    res.json({ configured: true, gsc, ga4 })
  } catch (err) {
    console.error('Analytics handler error:', err.message)
    res.status(500).json({ configured: true, error: err.message })
  }
}
