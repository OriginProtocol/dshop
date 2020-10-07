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
        red: {
          ...defaultTheme.colors.red,
          100: '#fcf8f8',
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
