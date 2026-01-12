/**
 * Simple in-memory rate limiting for API routes
 * For production, consider using Redis or a dedicated service
 */

import { env } from './env'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute

let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup(): void {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)

  // Don't prevent process exit
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Check rate limit for a given identifier (usually IP address)
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  startCleanup()

  const now = Date.now()
  const maxRequests = env.rateLimitMaxRequests
  const windowMs = env.rateLimitWindowMs

  let record = rateLimitStore.get(identifier)

  // Create new record or reset if window expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(identifier, record)
  }

  record.count++

  const remaining = Math.max(0, maxRequests - record.count)
  const success = record.count <= maxRequests

  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: record.resetTime,
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check common headers for proxy/CDN setups
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.resetTime.toString())
  return headers
}

/**
 * Rate limit response for exceeded limits
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        ...Object.fromEntries(rateLimitHeaders(result)),
      },
    }
  )
}
