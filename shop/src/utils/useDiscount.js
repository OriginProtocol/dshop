import { useEffect, useState } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import usePaymentDiscount from 'utils/usePaymentDiscount'

function useDiscount() {
  const { config } = useConfig()
  const [error, setError] = useState()
  const [code, setCode] = useState('')
  const [{ cart }, dispatch] = useStateValue()

  const discountObj = get(cart, 'discountObj')
  const activeCode = get(cart, 'discountObj.code', '').toUpperCase()
  const { paymentDiscount } = usePaymentDiscount()

  useEffect(() => {
    // Default to payment discount, if none is present
    if (!discountObj || (!discountObj.discountType && paymentDiscount)) {
      dispatch({ type: 'setDiscount', discount: paymentDiscount })
    }
  }, [discountObj, paymentDiscount])

  function check() {
    if (!code) {
      return
    }
    fetch(`${config.backend}/check-discount`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
      },
      body: JSON.stringify({ code })
    })
      .then((res) => res.json())
      .then((response) => {
        const discount = response.discount || response
        if (!discount || !discount.code) {
          setError(true)
        } else {
          dispatch({ type: 'setDiscount', discount })
          setCode('')
          setError(false)
        }
      })
  }

  function remove() {
    setCode('')
    dispatch({ type: 'removeDiscount' })
  }

  return { code, setCode, error, activeCode, check, remove }
}

export default useDiscount
