/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Zone colour language — consistent everywhere
        zone: {
          recovery: '#3b82f6',   // calm blue
          easy: '#22c55e',        // green
          steady: '#eab308',      // yellow
          threshold: '#f97316',   // orange
          race: '#ef4444',        // red
          deload: '#a855f7',      // purple
          rest: '#6b7280',        // grey
        },
        // PDF aesthetic: grey = start, teal = finish
        fig: {
          start: '#9ca3af',
          finish: '#14b8a6',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      spacing: {
        // Thumb-reachable targets
        tap: '48px',
        'tap-sm': '44px',
      },
      maxWidth: {
        app: '480px', // mobile-first; centred on desktop
      },
      animation: {
        'tick': 'tick 0.3s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        tick: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
