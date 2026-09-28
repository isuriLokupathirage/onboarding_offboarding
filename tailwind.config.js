export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        amberlight: '#FEF3C7',
        ink: '#0F172A',
        muted: '#64748B',
        subtle: '#94A3B8',
        line: '#E5E9F0',
        canvas: '#F7F8FA',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        pop: '0 10px 30px -10px rgb(15 23 42 / 0.20)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
