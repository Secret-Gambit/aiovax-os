/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#d4af37',
          500: '#c5a028',
          600: '#b8941f',
        },
        dark: {
          900: '#0a0a0a',
          800: '#141414',
          700: '#1a1a1a',
          600: '#262626',
        },
        win: '#22c55e',
        loss: '#ef4444',
      },
    },
  },
  plugins: [],
}
