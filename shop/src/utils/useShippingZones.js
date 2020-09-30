import { useEffect, useState } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'

import useConfig from 'utils/useConfig'

function useShippingZones() {
  const { config } = useConfig()
  const [{ shippingZones, cart, reload }, dispatch] = useStateValue()
  const [loading, setLoading] = useState(true)
  const [configLoading, setConfigLoading] = useState(true)
  const [error, setError] = useState(false)

  const userInfo = get(cart, 'userInfo')
  const items = get(cart, 'items')
  const shippingApi = get(config, 'shippingApi')

  useEffect(() => {
    if (!configLoading || (shippingApi && (!userInfo || !items))) {
      return
    }

    setConfigLoading(false)
  }, [shippingApi, userInfo, items, configLoading])

  useEffect(() => {
    async function fetchShippingZones() {
      if (configLoading) {
        return
      }

      setLoading(true)
      let zones = []
      try {
        if (config.shippingApi) {
          const raw = await fetch(`${config.backend}/shipping`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              authorization: `bearer ${encodeURIComponent(
                config.backendAuthToken
              )}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: cart.items,
              recipient: cart.userInfo
            })
          })
          const json = await raw.json()
          if (json.success !== false) {
            zones = json
          }
        }

        if (!zones.length) {
          const raw = await fetch(`${config.dataSrc}shipping.json`)
          zones = await raw.json()
        }

        dispatch({ type: 'setShippingZones', zones })
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError(true)
      }
    }

    fetchShippingZones()
  }, [configLoading, reload.shippingZones])

  return { shippingZones, loading, error }
}

export default useShippingZones
