import { useEffect } from 'react'
import { useStateValue } from 'data/state'
import get from 'lodash/get'

const useThemeVars = () => {
  const [{ config }, dispatch] = useStateValue()
  const themeId = get(config, 'themeId')

  useEffect(() => {
    if (window.enableLivePreview && themeId) {
      // Create a BroadcastChannel to listen to changes
      // to the theme config and update them on the go
      // TODO: Should this channel name be unique to each tab???
      const bc = new BroadcastChannel(`${themeId}_preview_channel`)

      bc.onmessage = (event) => {
        dispatch({
          type: 'setConfigSimple',
          config: {
            ...config,
            theme: {
              ...config.theme,
              [themeId]: event.data
            }
          }
        })
      }

      // Hack: To let the theme editor know that page
      // has loaded and data can be sent
      bc.postMessage({
        resendData: true
      })

      return () => bc.close()
    }
  }, [themeId])

  return get(config, `theme.${themeId}`, {})
}

export default useThemeVars
