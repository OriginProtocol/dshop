import { useState } from 'react'
import { useStateValue } from 'data/state'
import fetchConfig from 'data/fetchConfig'

function useConfig() {
  const [{ config }, dispatch] = useStateValue()
  const [error, setError] = useState()

  function setActiveShop(shopSlug) {
    if (shopSlug === true) {
      shopSlug =
        localStorage.activeShop ||
        document.querySelector('link[rel="data-dir"]').getAttribute('href')
    }

    const dataSrc = !shopSlug
      ? null
      : shopSlug.endsWith('/')
      ? shopSlug
      : `${shopSlug}/`

    fetchConfig(dataSrc, shopSlug)
      .then((config) => {
        setError(false)
        dispatch({ type: 'setConfig', config })
      })
      .catch(() => {
        setError(true)
      })
  }

  return { config, error, setActiveShop }
}

export default useConfig
