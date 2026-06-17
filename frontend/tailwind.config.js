/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3DBE3D',
        'primary-light': '#66d666',
        'primary-dark': '#2d942d',
        secondary: '#0ea5e9',
        dark: '#0f172a',
        darker: '#020617',
      },
    },
  },
  plugins: [],
}
