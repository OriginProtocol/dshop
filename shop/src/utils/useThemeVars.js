import { useEffect } from 'react'
import { useStateValue } from 'data/state'
import get from 'lodash/get'
import { useHistory } from 'react-router-dom'

const useThemeVars = () => {
  const [{ config }, dispatch] = useStateValue()
  const themeId = get(config, 'themeId')

  const history = useHistory()

  useEffect(() => {
    if (window.enableLivePreview && themeId) {
      // Create a BroadcastChannel to listen to changes
      // to the theme config and update them on the go
      // TODO: Should this channel name be unique to each tab???
      const bc = new BroadcastChannel(`${themeId}_preview_channel`)

      bc.onmessage = (event) => {
        switch (event.data.type) {
          case 'DATA_UPDATE':
            dispatch({
              type: 'setConfigSimple',
              config: {
                ...config,
                theme: {
                  ...config.theme,
                  [themeId]: event.data.changes
                }
              }
            })
            break

          case 'SECTION_CHANGED':
            const pageUrl = get(event.data, 'section.pageUrl')
            if (pageUrl && history.location.pathname !== pageUrl) {
              history.push(pageUrl)
              window.scrollTo(0, 0)
            }
            break
        }
      }

      // Hack: To let the theme editor know that page
      // has loaded and data can be sent
      bc.postMessage({
        type: 'DATA_REQUEST'
      })

      return () => bc.close()
    }
  }, [themeId])

  return get(config, `theme.${themeId}`, {})
}

export default useThemeVars
