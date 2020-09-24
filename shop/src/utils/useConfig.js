import { useState } from 'react'
import { useStateValue } from 'data/state'
import { fetchConfig } from 'data/fetchConfig'

function useConfig() {
  const [{ config }, dispatch] = useStateValue()
  const [error, setError] = useState()

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
        setError(false)
        config.activeShop = config.backendAuthToken
        dispatch({ type: 'setConfig', config })
      })
      .catch(() => {
        setError(true)
      })
  }

  function refetch() {
    setActiveShop(true)
  }

  return { config, error, setActiveShop, refetch }
}

export default useConfig
