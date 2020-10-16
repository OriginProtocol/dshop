import { useEffect, useState } from 'react'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'
import useThemeVars from 'utils/useThemeVars'
import themeJson from '../theme.json'

/**
 * Returns an object of classNames to be used
 * with tailwind
 */
const usePalette = () => {
  const themeVars = useThemeVars()
  const selectedPaletteId = get(themeVars, 'colors.palette')

  const [values, setValues] = useState({
    colors: {},
    fonts: {}
  })

  useEffect(() => {
    const palettes = themeJson.config
      .find((section) => section.id === 'colors')
      .fields.find((field) => field.type === 'color_palettes')

    const paletteId = selectedPaletteId || get(palettes, 'palettes.0.id')

    const newValues = {
      colors: Object.keys(palettes.colorLabels).reduce((colors, label) => {
        return {
          ...colors,
          [label]: kebabCase(`${paletteId}-${label}`)
        }
      }, {}),
      fonts: Object.keys(palettes.fontLabels).reduce((fonts, label) => {
        return {
          ...fonts,
          [label]: kebabCase(`${paletteId}-${label}`)
        }
      }, {})
    }

    setValues(newValues)

    // Override page background
    document.body.classList.add(`bg-${newValues.colors.pageBg}`)

    return () => {
      document.body.classList.remove(`bg-${newValues.colors.pageBg}`)
    }
  }, [selectedPaletteId])

  return values
}

export default usePalette
