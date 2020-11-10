import { useEffect, useState } from 'react'

import _get from 'lodash/get'

import fetchProduct from 'data/fetchProduct'
import useConfig from 'utils/useConfig'
import fetchProductStock from 'data/fetchProductStock'

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

      if (config.inventory) {
        const { success, product: stockData } = await fetchProductStock(
          productId,
          config
        )

        if (success) {
          product.quantity = stockData.stockLeft
          product.variants = _get(product, 'variants', []).map((variant) => ({
            ...variant,
            quantity: _get(
              stockData.variantsStock,
              variant.id,
              variant.quantity || 0
            )
          }))
        }
      }

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
