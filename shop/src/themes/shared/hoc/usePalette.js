import { useEffect } from 'react'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'
import useThemeVars from 'utils/useThemeVars'

/**
 * Returns an object of classNames to be used
 * with tailwind
 */
const usePalette = (themeJson) => {
  const themeVars = useThemeVars()
  const selectedPaletteId = get(themeVars, 'colors.palette')

  useEffect(() => {
    const paletteField = themeJson.config
      .find((section) => section.id === 'colors')
      .fields.find((field) => field.type === 'color_palettes')

    const palettes = get(paletteField, 'palettes', [])
    const paletteId = selectedPaletteId || get(palettes, '0.id')

    const selectedPalette = palettes.find((p) => p.id === paletteId)

    if (!selectedPalette) return

    // Set CSS variables
    Object.keys(selectedPalette.colors).map((key) => {
      document.documentElement.style.setProperty(
        `--${kebabCase(key)}-color`,
        selectedPalette.colors[key]
      )
    })

    Object.keys(selectedPalette.fonts).map((key) => {
      document.documentElement.style.setProperty(
        `--${kebabCase(key)}-font`,
        selectedPalette.fonts[key]
      )
    })

    // Override page background
    document.body.classList.add('bg-page')

    return () => {
      document.body.classList.remove('bg-page')
    }
  }, [selectedPaletteId])
}

export default usePalette
