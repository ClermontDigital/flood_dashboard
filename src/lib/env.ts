// Environment configuration with type safety and defaults

export const env = {
  // API endpoints
  wmipBaseUrl: process.env.NEXT_PUBLIC_WMIP_BASE_URL || 'https://water-monitoring.information.qld.gov.au/cgi/webservice.exe',
  bomWaterdataUrl: process.env.NEXT_PUBLIC_BOM_WATERDATA_URL || 'https://www.bom.gov.au/waterdata/services',
  bomWarningsUrl: process.env.NEXT_PUBLIC_BOM_WARNINGS_URL || 'https://www.bom.gov.au/fwo/IDQ60000.warnings_qld.xml',

  // QLDTraffic API (road closures)
  qldTrafficApiKey: process.env.QLDTRAFFIC_API_KEY || '',
  qldTrafficApiUrl: process.env.QLDTRAFFIC_API_URL || 'https://api.qldtraffic.qld.gov.au/v2/events',
  qldTrafficWebsiteUrl: 'https://qldtraffic.qld.gov.au/',

  // Application settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true' && process.env.NODE_ENV !== 'production',

  // Timing
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '300000', 10),
  staleThreshold: parseInt(process.env.NEXT_PUBLIC_STALE_THRESHOLD || '7200000', 10),

  // Rate limiting
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

  // Monitoring
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
} as const

// Validate critical environment variables in production
export function validateEnv(): void {
  if (env.isProduction) {
    if (env.enableMockData) {
      console.warn('WARNING: Mock data is enabled in production. This should be disabled.')
    }
    if (!env.qldTrafficApiKey) {
      console.warn('WARNING: QLDTRAFFIC_API_KEY is not set. Road closure data will be unavailable.')
    }
  }
}
