import { useEffect, useState } from 'react'
import memoize from 'lodash/memoize'

import useConfig from 'utils/useConfig'

const getDiscountData = memoize(
  async function getDiscountData(backend, shopSlug) {
    return await fetch(`${backend}/discounts/payment`, {
      credentials: 'include',
      headers: { authorization: `bearer ${encodeURIComponent(shopSlug)}` }
    }).then((res) => res.json())
  },
  (...args) => args[1]
)

function usePaymentDiscount() {
  const { config } = useConfig()
  const [paymentDiscount, setPaymentDiscount] = useState(null)

  const { backend, backendShopSlug } = config

  useEffect(() => {
    getDiscountData(backend, backendShopSlug).then((data) => {
      setPaymentDiscount(data.paymentDiscount)
    })
  }, [])

  return { paymentDiscount }
}

export default usePaymentDiscount
