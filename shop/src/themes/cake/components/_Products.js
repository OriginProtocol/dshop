import React, { useMemo } from 'react'
import get from 'lodash/get'

import Link from 'components/Link'
import useThemeVars from 'utils/useThemeVars'
import useConfig from 'utils/useConfig'

import useProducts from 'utils/useProducts'
import useCollections from 'utils/useCollections'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'
import { useRouteMatch } from 'react-router-dom'

const Products = ({ offset = 0, limit = Infinity, onlyFeatured, cols = 3 }) => {
  const { config } = useConfig()
  const { products } = useProducts()
  const { collections } = useCollections()
  const currencyOpts = useCurrencyOpts()
  const match = useRouteMatch('/products/:collection')
  const activeCollectionId = get(match, 'params.collection')

  const themeVars = useThemeVars()

  const featuredProductIds = get(themeVars, 'home.featuredProducts', [])

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

    if (onlyFeatured) {
      return featuredProductIds
        .map((productId) => _products.find((p) => p.id === productId))
        .filter((p) => Boolean(p))
    }

    return _products
  }, [
    onlyFeatured,
    products,
    featuredProductIds,
    activeCollectionId,
    collections
  ])

  return (
    <div
      className={`grid grid-cols-1 ${
        cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
      } gap-x-5 gap-y-12 text-center`}
    >
      {productsToRender.slice(offset, offset + limit).map((product) => {
        const relPath =
          product.imageUrl || `${config.backend}/images/default-image.svg`
        const isOutOfStock = config.inventory && Number(product.quantity) <= 0
        return (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className={`${isOutOfStock ? 'opacity-50' : ''}`}
          >
            <div
              className="w-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${relPath})`,
                backgroundSize: product.imageUrl ? undefined : '100px',
                backgroundColor: product.imageUrl ? undefined : '#cbd5e0',
                paddingTop: '100%'
              }}
            />
            <div className="mt-6 font-bold font-header">{product.title}</div>
            <div className="flex">
              {formatPrice(product.price, currencyOpts)}
              {!isOutOfStock ? null : (
                <div className="text-red-500 ml-2">Out of stock</div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default Products
