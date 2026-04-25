export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0d1f3c',
          900: '#122347',
          800: '#1B3A6B',
          700: '#224a8a',
          600: '#2a5aa8',
          100: '#d4e2f7',
          50:  '#eef4fd',
        },
        gold: {
          600: '#a8882a',
          500: '#C9A54C',
          400: '#d4b567',
          100: '#f7f0d8',
          50:  '#fdf8ec',
        },
        surface: '#F9F8F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
