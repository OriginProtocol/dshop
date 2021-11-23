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
      colors: {
        gray: {
          ...defaultTheme.colors.gray,
          100: '#fcfcfc',
          500: 'var(--secondary-color)',
          900: 'var(--accent-color)'
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
      },
      inset: { '-3': '-0.75rem' }
    }
  }
}
