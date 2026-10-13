/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // POS360 "Supply Chain Ops" design tokens. The same values live as CSS
      // variables on :root in app/globals.css.
      colors: {
        base: '#0A0A0B',
        elev: '#0E0E11',
        primary: {
          DEFAULT: '#EF4023',
          hover: '#D6371C',
        },
        muted: '#9CA3AF',
        dim: '#6B7280',
        synced: '#34D399',
      },
      fontFamily: {
        sans: ['Figtree', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      keyframes: {
        pulseFlash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        flash: 'pulseFlash 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
