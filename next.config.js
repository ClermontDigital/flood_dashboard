/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sharp'],
  images: {
    unoptimized: true,
  },
  // Disable React Strict Mode to fix react-leaflet "Map container already initialized" error
  // This is a known issue with react-leaflet and React 18 Strict Mode
  // See: https://github.com/PaulLeCam/react-leaflet/issues/1133
  reactStrictMode: false,
}

module.exports = nextConfig
