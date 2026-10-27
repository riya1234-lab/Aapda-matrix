/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'emergency-orange': '#F97316',
        'critical-red': '#DC2626',
        'dark-navy': '#0F172A',
        'tactical-dark': '#0B1120',
        'tactical-panel': '#1E293B',
        'tactical-border': '#334155',
        'light-gray': '#F1F5F9',
        'success-green': '#16A34A',
        'brand-blue': '#2563EB',
        'accent-cyan': '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beacon': 'beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        beacon: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
