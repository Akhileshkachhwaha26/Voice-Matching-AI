/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0D0F',
        surface: '#14171A',
        surface2: '#1B2023',
        line: '#262B2F',
        amber: '#E8A33D',
        signal: '#7FD9A8',
        warn: '#E8654A',
        mute: '#7A8288',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232,163,61,0.25), 0 8px 30px rgba(232,163,61,0.08)',
      },
    },
  },
  plugins: [],
}
