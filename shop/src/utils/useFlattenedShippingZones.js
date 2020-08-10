import { useState, useEffect } from 'react'
import get from 'lodash/get'

import useShippingZones from './useShippingZones'
import shippingTimes from './shippingTimes'

const flattenShippingZones = (shippingZones) => {
  const out = []

  let index = 0

  for (const zone of shippingZones) {
    if (!zone.rates || !zone.rates.length) {
      // Probably an old shipping.json file
      out.push(zone)
      continue
    }

    for (const rate of zone.rates) {
      const stime = shippingTimes.find((time) => time.value === rate.type)
      out.push({
        id: index++,
        countries: zone.countries,
        label: get(stime, 'label'),
        processingTime: get(stime, 'processingTime'),
        amount: rate.amount,
        detail: get(stime, 'detail')
      })
    }
  }

  return out
}

const useFlattenedShippingZones = () => {
  const { shippingZones: unflattenedData, ...props } = useShippingZones()

  const [shippingZones, setShippingZones] = useState([])

  useEffect(() => {
    setShippingZones(flattenShippingZones(unflattenedData))
  }, [unflattenedData])

  return {
    shippingZones,
    ...props
  }
}

export default useFlattenedShippingZones
