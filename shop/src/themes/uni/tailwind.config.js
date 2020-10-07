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
        gray: {
          ...defaultTheme.colors.gray,
          800: '#333333',
          600: '#666666',
          400: '#999999'
        }
      },
      fontFamily: {
        sans: ['PTSans', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}
