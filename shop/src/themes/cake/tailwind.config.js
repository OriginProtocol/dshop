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
      colors: {
        red: {
          ...defaultTheme.colors.red,
          100: '#fcf8f8',
          400: '#d18172'
        },
        page: 'var(--page-color)',
        footer: 'var(--footer-color)',
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        button: 'var(--button-color)',
        link: 'var(--link-color)',
        accent: 'var(--accent-color)'
      },
      fontFamily: {
        body: ['var(--body-font)', ...defaultTheme.fontFamily.sans],
        header: ['var(--header-font)', ...defaultTheme.fontFamily.serif]
      }
    }
  }
}
