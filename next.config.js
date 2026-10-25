/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Disable React Strict Mode to fix react-leaflet "Map container already initialized" error
  // This is a known issue with react-leaflet and React 18 Strict Mode
  // See: https://github.com/PaulLeCam/react-leaflet/issues/1133
  reactStrictMode: false,
  // Put <title>, description and canonical in <head> for every visitor. By default Next streams
  // them into <body> on dynamic pages for crawlers it doesn't recognise, and Google ignores a
  // canonical outside <head>.
  htmlLimitedBots: /.*/,
  poweredByHeader: false,
}

module.exports = nextConfig
