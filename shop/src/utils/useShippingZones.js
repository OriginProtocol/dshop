import { useEffect, useState } from 'react'

import { useStateValue } from 'data/state'

import useConfig from 'utils/useConfig'

function useShippingZones() {
  const { config } = useConfig()
  const [{ shippingZones, cart, reload }, dispatch] = useStateValue()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchShippingZones() {
      setLoading(true)
      let zones = []
      try {
        if (config.shippingApi) {
          const raw = await fetch(`${config.backend}/shipping`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              authorization: `bearer ${config.backendAuthToken}`,
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
  }, [reload.shippingZones])

  return { shippingZones, loading, error }
}

export default useShippingZones
