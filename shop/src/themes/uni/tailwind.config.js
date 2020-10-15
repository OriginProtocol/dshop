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
      lg: '0 0 14px 0 #cdd7e0'
    },
    extend: {
      screens: {
        dark: '0px' // Enable dark mode on shared checkout
      },
      colors: {
        green: {
          ...defaultTheme.colors.green,
          600: '#53ff96'
        },
        blue: {
          ...defaultTheme.colors.blue,
          600: '#4b9dff'
        },
        purple: {
          ...defaultTheme.colors.purple,
          600: '#f644ff'
        },
        gray: {
          ...defaultTheme.colors.gray,
          800: '#333333',
          600: '#666666',
          400: '#999999',
          300: '#cdd7e0'
        }
      },
      fontFamily: {
        sans: ['PTSans', ...defaultTheme.fontFamily.sans]
      }
    }
  }
}
