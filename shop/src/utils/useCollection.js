import get from 'lodash/get'
import useCollections from 'utils/useCollections'
import useProducts from 'utils/useProducts'

function useCollection(id, opts = {}) {
  const { allProductIds } = useProducts()
  const { visibleCollections } = useCollections(opts)
  const collection = visibleCollections.find((c) => c.id === id)
  let previousProduct, nextProduct

  if (opts.product) {
    const products = get(collection, 'products', allProductIds)
    const productIdx = products.indexOf(opts.product)
    if (productIdx > 0) {
      previousProduct = products[productIdx - 1]
    }
    if (productIdx >= 0 && productIdx < products.length) {
      nextProduct = products[productIdx + 1]
    }
  }

  return { collection, previousProduct, nextProduct }
}

export default useCollection
