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
        orange: {
          ...defaultTheme.colors.orange,
          400: '#cfb47d'
        }
      },
      fontFamily: {
        sans: ['"Garamond Pro"', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}
