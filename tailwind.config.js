/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xxs: '375px',
      xs: '425px',
      ...defaultTheme.screens,
    },
    extend: {
      screens:{
        mobile: 
        {
          'raw': '(max-width: 640px)',
        },
        tablet: 
        {
          'raw': '(max-width: 768px)',
        }

      }

    },
  },
  variants: {
    extend: {
      visibility: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
