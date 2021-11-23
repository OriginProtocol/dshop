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
      fontSize: {
        ...defaultTheme.fontSize,
        '7xl': '5.25rem'
      },
      opacity: {
        ...defaultTheme.opacity,
        40: '.4'
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
        orange: {
          ...defaultTheme.colors.purple,
          600: '#fec100'
        },
        gray: {
          ...defaultTheme.colors.gray,
          900: '#222222',
          800: '#333333',
          600: '#666666',
          400: '#999999',
          300: '#cccccc'
        }
      },
      fontFamily: {
        sans: ['IBMPlexSans', ...defaultTheme.fontFamily.sans]
      },
      inset: { '-3': '-0.75rem' }
    }
  }
}
