const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  purge: { content: ['./**/*.js', './app.css'] },
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true
  },
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        xl: '1024px'
      }
    },
    extend: {
      screens: {
        dark: '0px' // Enable dark mode on shared checkout
      },
      colors: {
        orange: {
          ...defaultTheme.colors.orange,
          400: '#cfb47d'
        },
        gray: {
          ...defaultTheme.colors.gray,
          600: '#666666'
        }
      },
      fontFamily: {
        sans: ['"Garamond Pro"', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}
