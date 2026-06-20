/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0EEFB',
          100: '#E0DCF7',
          500: '#534AB7',
          600: '#453D9C',
          700: '#373081',
        }
      }
    },
  },
  plugins: [],
}
