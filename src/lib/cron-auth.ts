import { timingSafeEqual } from 'crypto'

/**
 * Cron endpoints accept only the shared secret that Cloud Scheduler sends in the
 * `x-cron-secret` header (configured on the scheduler job, value from Secret Manager).
 * The service is public, so headers like User-Agent can't be trusted.
 * Local development without CRON_SECRET set is allowed through.
 */
export function isCronAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return process.env.NODE_ENV === 'development'
  }

  const provided = request.headers.get('x-cron-secret')
  if (!provided) return false

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
