import { useState, useEffect } from 'react'

import useOrigin from 'utils/useOrigin'
import { useStateValue } from 'data/state'

function useOrder({ tx, password }) {
  const { getOffer, status } = useOrigin()
  const [cart, setCart] = useState()
  const [error, setError] = useState()
  const [loading, setLoading] = useState()
  const [, dispatch] = useStateValue()

  useEffect(() => {
    async function go() {
      const result = await getOffer({ tx, password })
      if (result) {
        setCart(result.cart)
        setError(false)
        dispatch({ type: 'orderComplete' })
      } else {
        setError(true)
      }
      setLoading(false)
    }
    if (getOffer && !cart && !loading && status !== 'loading') {
      setLoading(true)
      go()
    }
  }, [tx, password, status])

  return { order: cart, loading, error }
}

export default useOrder
