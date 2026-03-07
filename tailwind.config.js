/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        butter: '#FAD97A',
        brown: '#7B5E3A',
        cream: '#FEFCF5',
        peach: '#F7B8A0',
        lavender: '#D4C5F0',
      },
      fontFamily: {
        'ibm-bold': ['IBMPlexSansKR-Bold'],
        'ibm-semibold': ['IBMPlexSansKR-SemiBold'],
        'ibm-regular': ['IBMPlexSansKR-Regular'],
      },
    },
  },
  plugins: [],
};

