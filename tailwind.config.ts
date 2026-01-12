import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        flood: {
          safe: '#22c55e',
          watch: '#eab308',
          warning: '#f97316',
          danger: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}

export default config
