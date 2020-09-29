const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        xl: '1024px'
      }
    },
    extend: {
      colors: {
        gray: {
          ...defaultTheme.colors.red,
          400: '#d18172'
        }
      },
      fontFamily: {
        sans: ['Avenir', ...defaultTheme.fontFamily.sans],
        serif: ['Philosopher', ...defaultTheme.fontFamily.serif]
      }
    }
  }
}
