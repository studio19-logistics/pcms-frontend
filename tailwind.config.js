/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core palette lifted from the reference design — near-black
        // charcoal background, translucent card surfaces, soft powder
        // blue accent. brand.* keeps the old name so existing class
        // references (bg-brand-500 etc) still work without a full
        // find-replace across every page; it now points at the new
        // accent blue instead of the old purple.
        brand: {
          50: '#EAF4F8',
          100: '#D5E9F1',
          400: '#9CC5D9',
          500: '#B0D6E6',
          600: '#8FBDD2',
          700: '#6FA3BC',
        },
        surface: {
          DEFAULT: '#272A2A',   // page background
          card: '#33373799',    // translucent card fill (use with bg-surface-card)
          raised: '#3A3E3E',    // slightly lighter card / hover state
          border: '#FFFFFF1A',  // hairline border on dark cards
        },
        ink: {
          DEFAULT: '#FFFFFF',
          dim: '#A8ADAD',
          faint: '#74797A',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
    },
  },
  plugins: [],
}