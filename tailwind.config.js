/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0b0c0e',
          card: '#121418',
          cardHover: '#181b22',
          sidebar: '#0e1013',
          border: '#1f232c',
        },
        plexus: {
          green: '#00f076',
          greenDark: '#059648',
          accent: '#22c55e',
          warnBg: '#211212',
          warnBorder: '#4a2121',
          warnText: '#f87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
