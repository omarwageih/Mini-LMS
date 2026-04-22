/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        must: {
          blue: {
            DEFAULT: '#003366',
            dark: '#002244',
            light: '#004488',
          },
          gold: {
            DEFAULT: '#C5A059',
            light: '#D4AF37',
            dark: '#B8860B',
          }
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      }
    },
  },
  plugins: [],
}
