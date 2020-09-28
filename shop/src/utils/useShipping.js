import { useEffect } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import { Countries } from '@origin/utils/Countries'

import useFlattenedShippingZones from 'utils/useFlattenedShippingZones'

function useShipping() {
  const [{ cart }, dispatch] = useStateValue()
  const { shippingZones, loading } = useFlattenedShippingZones()

  const country = get(cart, 'userInfo.country')
  const countryCode = get(Countries, `${country}.code`)
  const defaultShippingZone = shippingZones.find(
    (zone) => !get(zone, 'countries.length', 0)
  )
  const filteredShippingZones = shippingZones.filter(
    (zone) => (zone.countries || []).indexOf(countryCode) >= 0
  )
  if (!filteredShippingZones.length && defaultShippingZone) {
    filteredShippingZones.push(defaultShippingZone)
  }

  const unshippableItems = cart.items.filter((item) => {
    const restrictTo = get(item, 'restrictShippingTo', [])
    if (!restrictTo.length) {
      return false
    }
    return restrictTo.indexOf(countryCode) < 0
  })

  useEffect(() => {
    const selected = get(cart, 'shipping.id')
    const hasSelected = filteredShippingZones.find((z) => z.id === selected)
    if (!cart.shipping || !hasSelected) {
      const zone = filteredShippingZones[0]
      if (zone) {
        dispatch({ type: 'updateShipping', zone })
      }
    }
  }, [shippingZones.length])

  return {
    unshippableItems,
    zones: filteredShippingZones,
    loading
  }
}

export default useShipping
