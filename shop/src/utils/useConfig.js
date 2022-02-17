import { useState } from 'react'
import { useStateValue } from 'data/state'
import { fetchConfig } from 'data/fetchConfig'
import useIsMounted from 'utils/useIsMounted'

function useConfig() {
  const [{ config }, dispatch] = useStateValue()
  const [error, setError] = useState()
  const isMounted = useIsMounted()

  function setActiveShop(shopSlug) {
    const dataDir = document
      .querySelector('link[rel="data-dir"]')
      .getAttribute('href')

    const isBackend = dataDir === 'DATA_DIR'
    if (shopSlug === true) {
      if (dataDir && !isBackend) {
        shopSlug = dataDir
      } else {
        shopSlug = localStorage.activeShop || dataDir
      }
    }

    const dataSrc = !shopSlug
      ? null
      : shopSlug.endsWith('/')
      ? shopSlug
      : `${shopSlug}/`

    fetchConfig(dataSrc, shopSlug, isBackend)
      .then((config) => {
        if (!isMounted.current) return
        setError(false)
        config.activeShop = config.backendAuthToken
        dispatch({ type: 'setConfig', config })
      })
      .catch(() => {
        if (!isMounted.current) return
        setError(true)
      })
  }

  function refetch() {
    setActiveShop(true)
  }

  return { config, error, setActiveShop, refetch }
}

export default useConfig
