import { useEffect, useState } from 'react'
import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

function useOrders(pageId, search) {
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [shouldReload, setReload] = useState(1)
  const [{ orders, ordersPagination }, dispatch] = useStateValue()

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      const params = new URLSearchParams()
      if (pageId) params.set('page', pageId)
      if (search) params.set('search', search)
      const raw = await fetch(`${config.backend}/orders?${params.toString()}`, {
        credentials: 'include',
        headers: {
          authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
        }
      })
      setLoading(false)
      if (!raw.ok) {
        return
      }
      const { orders, pagination } = await raw.json()
      dispatch({ type: 'setOrders', orders, pagination })
    }
    if (config.backendAuthToken) {
      fetchOrders()
    }
  }, [shouldReload, pageId, search, config.activeShop])

  return {
    orders,
    ordersPagination,
    loading,
    reload: () => setReload(shouldReload + 1)
  }
}

export default useOrders
