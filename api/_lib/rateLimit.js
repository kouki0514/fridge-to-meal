/**
 * In-memory sliding window rate limiter.
 *
 * NOTE: Vercel serverless functions may run across multiple instances, so this
 * store is per-instance. For strict cross-instance enforcement at scale, replace
 * the store with Vercel KV (https://vercel.com/docs/storage/vercel-kv).
 */

const WINDOW_MS = 60_000   // 1 minute
const MAX_REQUESTS = 10    // per IP per window

/** @type {Map<string, { count: number; resetAt: number }>} */
const store = new Map()

// Periodically evict expired entries to prevent unbounded memory growth.
// `unref()` ensures this timer does not prevent the process from exiting.
const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of store) {
    if (now > record.resetAt) store.delete(ip)
  }
}, WINDOW_MS)
if (typeof cleanup.unref === 'function') cleanup.unref()

/**
 * @param {string} ip
 * @returns {{ allowed: boolean; limit: number; remaining: number; resetAt: number }}
 */
export function checkRateLimit(ip) {
  const now = Date.now()
  const record = store.get(ip)

  if (!record || now > record.resetAt) {
    const resetAt = now + WINDOW_MS
    store.set(ip, { count: 1, resetAt })
    return { allowed: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - 1, resetAt }
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, limit: MAX_REQUESTS, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - record.count,
    resetAt: record.resetAt,
  }
}

/**
 * Extract the most-trusted client IP from Vercel/proxy headers.
 * x-forwarded-for may be a comma-separated list; the leftmost value is the client.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return String(forwarded).split(',')[0].trim()
  }
  return (
    req.headers['x-real-ip'] ??
    req.socket?.remoteAddress ??
    'unknown'
  )
}
