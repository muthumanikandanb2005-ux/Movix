/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        movix: {
          red: '#E50914',
          coral: '#FF4154',
          dark: '#080A0F',
          card: '#12151D',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Impact', 'Haettenschweiler', 'Arial Black', 'sans-serif']
      }
    },
  },
  plugins: [],
}
