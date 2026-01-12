/**
 * Next.js Instrumentation
 * Runs when the server starts up
 *
 * Cache warming disabled - WMIP connectivity during cold start is unreliable
 * Relying on stale-while-revalidate pattern in API route instead:
 * - First request fetches fresh data and caches it
 * - Subsequent requests get cached data instantly
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Server started - cache will warm on first request')
  }
}
