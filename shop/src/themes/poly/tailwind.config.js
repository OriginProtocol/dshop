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
    },
    typography: (theme) => ({
      default: {
        css: {
          color: '#ffffff',
          a: { color: theme('colors.orange.400') },
          h1: { color: '#ffffff' },
          h2: { color: '#ffffff' },
          h3: { color: '#ffffff' },
          h4: { color: '#ffffff' },
          h5: { color: '#ffffff' },
          h6: { color: '#ffffff' },
          strong: { color: '#ffffff' },
          blockquote: { color: '#ffffff' },
          code: { color: '#ffffff' },
          th: { color: '#ffffff' },
          td: {
            borderTop: '#ffffff',
            borderBottom: '#ffffff',
            borderRight: '#ffffff',
            borderLeft: '#ffffff'
          }
        }
      }
    }) //Note: The code under the 'typography' key is in accordance with the docs for @tailwindcss/typography v.0.2.0
  },
  plugins: [require('@tailwindcss/typography')]
}
