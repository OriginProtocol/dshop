import { useEffect, useState } from 'react'

import fetchProduct from '../data/fetchProduct'

function useProduct(productId) {
  const [product, setProduct] = useState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    setError(null)
    try {
      const product = await fetchProduct(
        `${localStorage.activeShop}/`,
        productId
      )
      setProduct(product)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      setError(true)
    }
  }

  useEffect(() => {
    if (!productId) {
      return
    }

    fetchProducts()
  }, [productId])

  return { product, loading, error }
}

export default useProduct
