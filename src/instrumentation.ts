/**
 * Next.js Instrumentation
 * Runs when the server starts up
 *
 * Used to pre-warm the cache so the first user request is fast
 * Uses direct function calls (no HTTP) to avoid MITM vulnerabilities
 */

export async function register() {
  // Only run on server-side (not during build or on client)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Server starting, warming cache...')

    // Import and run cache warmer directly (no HTTP requests)
    // This is secure - calls data sources directly using trusted code
    try {
      const { warmCache } = await import('./lib/cache-warmer')
      // Don't await - let it run in background so server starts immediately
      warmCache().catch((error) => {
        console.warn('[Instrumentation] Cache warming error:', error)
      })
    } catch (error) {
      console.warn('[Instrumentation] Failed to load cache warmer:', error)
    }
  }
}
