/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Enable instrumentation hook for cache warming on startup
  experimental: {
    instrumentationHook: true,
  },
}

module.exports = nextConfig
