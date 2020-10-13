import { useEffect, useMemo, useState } from 'react'
import get from 'lodash/get'

import useConfig from './useConfig'
import useThemes from './useThemes'

function useActiveTheme() {
  const { config } = useConfig()

  const activeThemeId = get(config, 'themeId')

  const { themes } = useThemes()

  const activeTheme = useMemo(() => {
    return themes.find((theme) => theme.id === activeThemeId)
  }, [activeThemeId, themes])

  return {
    activeThemeId,
    activeTheme
  }
}

export default useActiveTheme
