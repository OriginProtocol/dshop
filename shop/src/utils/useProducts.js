import { useEffect, useState } from 'react'

import { useStateValue } from 'data/state'

import useConfig from 'utils/useConfig'

function useProducts() {
  const [{ products, productIndex }, dispatch] = useStateValue()
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function fetchProducts() {
    setLoading(true)
    try {
      let products = []
      if (config.isAffiliate) {
        const raw = await fetch(`${config.backend}/affiliate/products`, {
          headers: {
            authorization: `bearer ${config.backendAuthToken}`
          },
          credentials: 'include'
        })
        products = await raw.json()
      } else {
        const raw = await fetch(`${config.dataSrc}products.json`)
        products = await raw.json()
      }
      setLoading(false)
      dispatch({ type: 'setProducts', products })
    } catch (e) {
      setLoading(false)
      setError(true)
    }
  }

  useEffect(() => {
    if (!products.length) {
      fetchProducts()
    }
  }, [])

  return { products, productIndex, loading, error, refetch: fetchProducts }
}

export default useProducts
