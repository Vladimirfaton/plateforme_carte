/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#185fa5',
        secondary: '#6b7280',
      },
    },
  },
  plugins: [],
};
