/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050816',
        surface: '#101826',
        accent: '#D4AF37',
        'accent-soft': '#F5E6B3',
        'primary-text': '#F9FAFB',
        'secondary-text': '#9CA3AF',
        'border-subtle': '#1F2933',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.10)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.10)',
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.10)',
        'accent': '0 0 0 1px #D4AF37',
        'accent-glow': '0 0 0 1px #D4AF37, 0 0 0 4px rgba(212, 175, 55, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      transitionProperty: {
        'transform': 'transform',
      }
    },
  },
  plugins: [],
}