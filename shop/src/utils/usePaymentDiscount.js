import { useEffect, useState } from 'react'
import memoize from 'lodash/memoize'

import useConfig from 'utils/useConfig'

const getDiscountData = memoize(
  async function getDiscountData(backend, authToken) {
    return await fetch(`${backend}/discounts/payment`, {
      credentials: 'include',
      headers: { authorization: `bearer ${encodeURIComponent(authToken)}` }
    }).then((res) => res.json())
  },
  (...args) => args[1]
)

function usePaymentDiscount() {
  const { config } = useConfig()
  const [paymentDiscount, setPaymentDiscount] = useState(null)

  const { backend, backendAuthToken } = config

  useEffect(() => {
    getDiscountData(backend, backendAuthToken).then((data) => {
      setPaymentDiscount(data.paymentDiscount)
    })
  }, [])

  return { paymentDiscount }
}

export default usePaymentDiscount
