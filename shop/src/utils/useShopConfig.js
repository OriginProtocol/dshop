import { useState, useEffect } from 'react'
import memoize from 'lodash/memoize'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

const getShopConfig = memoize(
  async function fetchShopConfig(backend, authToken) {
    const result = await fetch(`${backend}/config`, {
      credentials: 'include',
      headers: { authorization: `bearer ${encodeURIComponent(authToken)}` }
    }).then((raw) => raw.json())

    return result.config
  },
  (...args) => `${args[1]}-${args[2]}`
)

function useShopConfig() {
  const [{ reload }, dispatch] = useStateValue()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [shopConfig, setShopConfig] = useState()

  async function fetchConfig() {
    setLoading(true)
    const shopConfig = await getShopConfig(
      config.backend,
      config.backendAuthToken,
      reload.shopConfig
    )
    setLoading(false)
    setShopConfig(shopConfig)
  }

  useEffect(() => {
    fetchConfig()
  }, [config.activeShop, reload.shopConfig])

  return {
    loading,
    shopConfig,
    refetch: () => {
      getShopConfig.cache.clear()
      dispatch({ type: 'reload', target: 'shopConfig' })
    }
  }
}

export default useShopConfig
