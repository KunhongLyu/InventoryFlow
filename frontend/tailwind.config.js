/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F6F5F2',
        surface: '#FFFFFF',
        border: '#E3E1DC',
        ink: '#1B1D21',
        muted: '#6B6F76',
        accent: '#2B4C7E',
        alert: '#C4622D',
        ok: '#3F7D58',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
