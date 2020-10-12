import { useEffect, useMemo, useState } from 'react'
import fbt from 'fbt'
import memoize from 'lodash/memoize'
import cloneDeep from 'lodash/cloneDeep'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import sortProducts from 'utils/sortProducts'

const getProducts = memoize((url) => fetch(url).then((r) => r.json()))

function useProducts(opts = {}) {
  const [
    { products, productIndex, reload, collections },
    dispatch
  ] = useStateValue()
  const { config } = useConfig()
  const { get } = useBackendApi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isSubscribed = true

    async function fetchProducts() {
      setLoading(true)
      try {
        let products = []
        if (config.isAffiliate) {
          products = await get('/affiliate/products')
        } else {
          products = await getProducts(`${config.dataSrc}products.json`)
        }
        if (!isSubscribed) {
          return
        }
        products.forEach((product) => {
          if (product.data) {
            product.imageUrl = `${config.ipfsGateway}${product.data}/520/${product.image}`
          } else if (product.image) {
            product.imageUrl = `${config.dataSrc}${product.id}/520/${product.image}`
          }
        })
        dispatch({ type: 'setProducts', products })
        setLoading(false)
      } catch (e) {
        console.error(e)
        setError(true)
        setLoading(false)
      }
    }

    if (reload.products) {
      getProducts.cache.clear()
    }
    if (config.dataSrc) {
      fetchProducts()
    }

    return () => (isSubscribed = false)
  }, [config.dataSrc, reload.products])

  let collection = collections.find((c) => c.id === opts.collection)
  if (!collection && opts.collection === 'all') {
    collection = {
      id: 'all',
      title: fbt('All Products', 'products.allProducts')
    }
  }

  const filteredProducts = useMemo(() => {
    let filteredProducts = cloneDeep(products)
    if (productIndex && opts.search) {
      filteredProducts = productIndex
        .search({ query: opts.search, depth: 1 })
        .map((p) => products.find((product) => product.id === p))
        .filter((p) => p)
    } else if (collection && collection.products) {
      filteredProducts = collection.products
        .map((p) => products.find((product) => product.id === p))
        .filter((p) => p)
    }

    filteredProducts = sortProducts(filteredProducts, opts.sort)

    if (opts.start && opts.end) {
      filteredProducts = filteredProducts.slice(opts.start, opts.end)
    } else if (opts.limit) {
      filteredProducts = filteredProducts.slice(0, opts.limit)
    }

    return filteredProducts
  }, [products, productIndex, opts.search, collection])

  return {
    products: filteredProducts,
    allProductIds: products.map((p) => p.id),
    productIndex,
    loading,
    error
  }
}

export default useProducts
