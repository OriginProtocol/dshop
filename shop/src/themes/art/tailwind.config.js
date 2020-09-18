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
          ...defaultTheme.colors.gray,
          500: '#999999'
        }
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}
