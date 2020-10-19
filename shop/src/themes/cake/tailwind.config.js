const defaultTheme = require('tailwindcss/defaultTheme')
const kebabCase = require('lodash/kebabCase')
const themeJson = require('./theme.json')

/**
 * Reads colors & fonts from theme.json and converts them
 * into an object to extend the tailwind config
 */
const getPaletteConfig = () => {
  const palettes = themeJson.config
    .find((section) => section.id === 'colors')
    .fields.find((field) => field.type === 'color_palettes').palettes

  const colors = palettes.reduce((colors, palette) => {
    const newColors = { ...colors }

    Object.keys(palette.colors).map((colorKey) => {
      const key = kebabCase(`${palette.id}-${colorKey}`)
      const value = palette.colors[colorKey]
      newColors[key] = value
    })

    return newColors
  }, {})

  const fonts = palettes.reduce((fonts, palette) => {
    const newFonts = { ...fonts }

    Object.keys(palette.fonts).map((fontKey) => {
      const key = kebabCase(`${palette.id}-${fontKey}`)
      const value = palette.fonts[fontKey]
      newFonts[key] = [value, ...defaultTheme.fontFamily.sans]
    })

    return newFonts
  }, {})

  return {
    colors,
    fonts
  }
}

const paletteConfig = getPaletteConfig()

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
        red: {
          ...defaultTheme.colors.red,
          100: '#fcf8f8',
          400: '#d18172'
        },
        ...paletteConfig.colors
      },
      fontFamily: {
        sans: ['Avenir', ...defaultTheme.fontFamily.sans],
        serif: ['Philosopher', ...defaultTheme.fontFamily.serif],
        ...paletteConfig.fonts
      }
    }
  }
}
