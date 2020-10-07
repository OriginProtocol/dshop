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
    boxShadow: {
      lg: '0 0 5px 0 rgba(0, 0, 0, 0.1)'
    },
    extend: {
      fontFamily: {
        sans: ['Avenir', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        gray: {
          ...defaultTheme.colors.gray,
          100: '#fcfcfc',
          600: '#999999'
        },
        orange: {
          ...defaultTheme.colors.orange,
          400: '#c2a66c',
          100: '#f1f1ef'
        }
      }
    }
  }
}
