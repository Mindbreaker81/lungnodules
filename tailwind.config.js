/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F8FAFC',
      },
    },
  },
  plugins: [],
};
