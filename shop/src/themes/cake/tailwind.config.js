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
          100: 'var(--page-color)',
          400: 'var(--accent-color)'
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
        sans: ['var(--body-font)', ...defaultTheme.fontFamily.sans],
        body: ['var(--body-font)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--header-font)', ...defaultTheme.fontFamily.serif],
        header: ['var(--header-font)', ...defaultTheme.fontFamily.serif]
      }
    }
  }
}
