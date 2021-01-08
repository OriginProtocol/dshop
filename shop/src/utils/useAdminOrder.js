import { useState, useEffect } from 'react'
import { useStateValue } from 'data/state'
import memoize from 'lodash/memoize'
import useConfig from 'utils/useConfig'

const getOrder = memoize(
  async function fetchOrder(admin, orderId, backend, authToken) {
    return await fetch(`${backend}/orders/${orderId}`, {
      credentials: 'include',
      headers: { authorization: `bearer ${encodeURIComponent(authToken)}` }
    }).then((res) => res.json())
  },
  (...args) => args[1]
)

function useOrder(orderId) {
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState()
  const [{ admin, reload }] = useStateValue()
  const { backend, backendAuthToken } = config

  useEffect(() => {
    setLoading(true)
    const orderKey = `order-${orderId}`
    if (reload[orderKey]) {
      getOrder.cache.delete(orderId)
    }
    getOrder(admin, orderId, backend, backendAuthToken).then((order) => {
      setLoading(false)
      setOrder(order)
    })
  }, [orderId, reload[`order-${orderId}`]])

  return { loading, order }
}

export default useOrder
