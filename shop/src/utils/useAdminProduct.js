import { useEffect, useState } from 'react'

import fetchProduct from '../data/fetchProduct'
import useConfig from 'utils/useConfig'

function useAdminProduct(productId) {
  const [product, setProduct] = useState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const { config } = useConfig()

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      const product = await fetchProduct(config.dataSrc, productId)
      setProduct(product)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setError(true)
    }
  }

  useEffect(() => {
    if (!productId || productId === 'new') {
      return
    }
    fetchProducts()
  }, [productId, config.activeShop])

  return { product, loading, error }
}

export default useAdminProduct
