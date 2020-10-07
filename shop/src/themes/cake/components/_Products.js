import React, { useMemo } from 'react'
import get from 'lodash/get'

import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import useProducts from 'utils/useProducts'
import useCollections from 'utils/useCollections'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'
import { useRouteMatch } from 'react-router-dom'

const Products = ({ limit = Infinity, excludeFeatured, onlyFeatured }) => {
  const { products } = useProducts()
  const { collections } = useCollections()
  const { config } = useConfig()
  const currencyOpts = useCurrencyOpts()
  const match = useRouteMatch('/products/:collection')
  const activeCollectionId = get(match, 'params.collection')

  const featuredProductIds = get(config, 'theme.featuredProducts', [])

  const productsToRender = useMemo(() => {
    let _products = products

    if (activeCollectionId) {
      const coll = collections.find((c) => c.id === activeCollectionId)

      if (coll) {
        _products = coll.products
          .map((pId) => _products.find((p) => p.id === pId))
          .filter((p) => Boolean(p))
      }
    }

    if (excludeFeatured) {
      return _products.filter(
        (product) => !featuredProductIds.includes(product.id)
      )
    }

    if (onlyFeatured) {
      return featuredProductIds
        .map((productId) => _products.find((p) => p.id === productId))
        .filter((p) => Boolean(p))
    }

    return _products
  }, [
    excludeFeatured,
    onlyFeatured,
    products,
    featuredProductIds,
    activeCollectionId,
    collections
  ])

  const cols = onlyFeatured ? 2 : 3

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-${cols} gap-x-5 gap-y-12 text-center`}
    >
      {productsToRender.slice(0, limit).map((product) => {
        return (
          <Link key={product.id} to={`/product/${product.id}`}>
            <div
              className="w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${product.imageUrl})`,
                paddingTop: '100%'
              }}
            />
            <div className="mt-6 font-bold">{product.title}</div>
            <div>{formatPrice(product.price, currencyOpts)}</div>
          </Link>
        )
      })}
    </div>
  )
}

export default Products
