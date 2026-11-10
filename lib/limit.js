// Rate limiting: Upstash Redis sliding window when configured, in-memory fallback otherwise.
const memory = new Map()
const limiters = {}
let upstashReady = null

async function upstash(perMinute) {
  if (upstashReady === false) return null
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) { upstashReady = false; return null }
  try {
    if (!limiters[perMinute]) {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')
      limiters[perMinute] = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(perMinute, '60 s'), prefix: 'pd' })
    }
    upstashReady = true
    return limiters[perMinute]
  } catch (err) {
    console.error('Upstash unavailable, using in-memory limit:', err.message)
    upstashReady = false
    return null
  }
}

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
}

export async function isRateLimited(key, perMinute) {
  const rl = await upstash(perMinute)
  if (rl) {
    const { success } = await rl.limit(key)
    return !success
  }
  const now = Date.now()
  const recent = (memory.get(key) || []).filter((t) => now - t < 60_000)
  recent.push(now)
  memory.set(key, recent)
  return recent.length > perMinute
}
