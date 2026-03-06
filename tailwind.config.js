/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        butter: '#F5E642',
        olive: '#6B7C3A',
        cream: '#FAFAF5',
        peach: '#FFB5A0',
        lavender: '#C9B8E8',
      },
    },
  },
  plugins: [],
};

