/**
 * CORS helper for Vercel serverless functions.
 *
 * Allowed origins are controlled by the ALLOWED_ORIGINS environment variable
 * (comma-separated list). When unset, localhost and *.vercel.app origins are
 * permitted automatically, which covers both local development and Vercel
 * preview/production deployments without extra configuration.
 *
 * Example .env:
 *   ALLOWED_ORIGINS=https://your-app.vercel.app,https://custom-domain.com
 */

const CONFIGURED = new Set(
  (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
)

/** Origins that are always trusted when ALLOWED_ORIGINS is not set. */
const AUTO_TRUST = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.vercel\.app$/,
]

/**
 * Returns the CORS origin value to use for a given request origin.
 * Returns the origin string if trusted, otherwise returns null (block).
 *
 * @param {string | undefined} origin
 * @returns {string | null}
 */
function resolveAllowedOrigin(origin) {
  if (!origin) return null

  // Explicit allow-list takes precedence
  if (CONFIGURED.size > 0) {
    return CONFIGURED.has(origin) ? origin : null
  }

  // Fall back to automatic trust rules
  if (AUTO_TRUST.some(re => re.test(origin))) return origin

  return null
}

/**
 * Set CORS headers on the response.
 * Call this before every response, including OPTIONS preflight.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} true if the origin is allowed, false otherwise
 */
export function setCorsHeaders(req, res) {
  const origin = req.headers.origin
  const allowed = resolveAllowedOrigin(origin)

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed)
    res.setHeader('Vary', 'Origin')
  }
  // If origin is not allowed we set no ACAO header → browser blocks the request.

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400') // cache preflight 24 h

  return allowed !== null
}
