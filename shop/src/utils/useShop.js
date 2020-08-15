import { useEffect, useState } from 'react'
import useBackendApi from './useBackendApi'

const useShop = (shopToken) => {
  const { get } = useBackendApi({ authToken: true })

  const [loading, setLoading] = useState(Boolean(shopToken))
  const [shop, setShop] = useState()

  const loadShop = async (shopToken) => {
    setLoading(true)

    try {
      const response = await get('/shop?shopToken=' + shopToken)
      setShop(response.shop)
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!shopToken) {
      setLoading(false)
      return
    }

    loadShop(shopToken)
  }, [shopToken])

  return {
    shop,
    loading
  }
}

export default useShop
