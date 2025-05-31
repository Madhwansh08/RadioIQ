/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './node_modules/react-photo-editor/dist/*.js',
  ],
  theme: {
    extend: {
      colors: {
        calendarIcon: '#ffffff', // White color for the calendar icon
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Set Poppins as the default sans-serif font
      },
      animation:{
        ring:'ring 1.5s infinite',
      },
      blur: {
        'custom': '3px', 
      },
      boxShadow: {
        'custom-blue': '0px 0 25px 0px rgba(30, 58, 138, 0.7), 0 0 6px 0px rgba(30, 58, 138, 0.5)',
      },
    },
    keyframes:{
      ring:{
        '0%, 100%': { boxShadow: '0 0 0 0 rgba(92, 96, 198, 0.7)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(92, 96, 198, 0)' },
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio'),
    function ({ addUtilities }) {
  addUtilities({
    '.calendar-picker': {
      'color-scheme': 'dark',
    },
    '.calendar-picker::-webkit-calendar-picker-indicator': {
      filter: 'invert(0)',
    },
    '.dark .calendar-picker': {
      'color-scheme': 'dark',
    },
    '.dark .calendar-picker::-webkit-calendar-picker-indicator': {
      filter: 'invert(100)',
    },
  });
}

  ],
  darkMode:'class',
}

