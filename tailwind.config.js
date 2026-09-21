/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './projects/*.html',
    './experience/*.html',
    './js/**/*.js',
    './README.md',
  ],
  theme: {
    extend: {
      colors: {
        // Dark control-room surfaces (near-black navy)
        ink: {
          950: '#04070d',
          900: '#070c16',
          850: '#0a111f',
          800: '#0d1626',
          700: '#131f36',
          600: '#1b2a45',
          500: '#26385a',
          400: '#3a4f74',
        },
        // Light "off-white" surfaces
        paper: {
          50: '#fdfefe',
          100: '#f6f8fb',
          200: '#eef1f6',
          300: '#e2e7f0',
          400: '#cfd7e5',
        },
        // Amber status accent (classic alarm/indicator amber)
        signal: {
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
        },
        // Green "running / healthy" accent
        go: {
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      maxWidth: {
        content: '76rem',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 18px 40px -28px rgba(2,6,23,0.55)',
        'panel-dark': '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 22px 48px -30px rgba(0,0,0,0.9)',
      },
      keyframes: {
        'led-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.9)' },
        },
        'trace-scan': {
          '0%': { transform: 'translateX(-12%)', opacity: '0' },
          '20%': { opacity: '0.9' },
          '100%': { transform: 'translateX(112%)', opacity: '0' },
        },
      },
      animation: {
        'led-pulse': 'led-pulse 2.4s ease-in-out infinite',
        'trace-scan': 'trace-scan 6s linear infinite',
      },
    },
  },
  plugins: [],
};
