/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A1A2E',
          50: '#F4F4F8',
          100: '#E4E4EE',
          700: '#2A2A45',
          900: '#1A1A2E',
        },
        ember: {
          DEFAULT: '#E8531A',
          50: '#FEF1EC',
          600: '#E8531A',
          700: '#C4430F',
        },
        stock: {
          up: '#1F9D55',
          down: '#D64545',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
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
