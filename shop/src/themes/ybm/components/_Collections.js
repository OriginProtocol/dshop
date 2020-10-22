import React, { useMemo } from 'react'
import get from 'lodash/get'
import Link from 'components/Link'

import useConfig from 'utils/useConfig'

import useProducts from 'utils/useProducts'
import useCollections from 'utils/useCollections'
import useThemeVars from 'utils/useThemeVars'

const Collections = ({ limit = Infinity }) => {
  const { config } = useConfig()
  const { collections } = useCollections()
  const { products } = useProducts()
  const themeVars = useThemeVars()

  const featuredCollectionIds = get(themeVars, 'home.featuredCollections', [])
  const featuredCollections = useMemo(() => {
    return featuredCollectionIds
      .map((cId) => collections.find((c) => c.id === cId))
      .filter((c) => Boolean(c))
      .map((collection) => {
        const product = products.find((p) => p.id === collection.products[0])
        return { collection, product }
      })
      .filter((c) => Boolean(c.product))
      .slice(0, limit)
  }, [featuredCollectionIds, collections, products, limit])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
      {featuredCollections.map(({ product, collection }) => {
        const relPath =
          product.imageUrl || `${config.backend}/images/default-image.svg`
        return (
          <Link
            key={collection.id}
            to={`/collections/${collection.id}`}
            className="text-center sm:text-left font-medium text-2xl"
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
            <div className="px-4 sm:px-0">
              <div className="mt-6 leading-none ">{collection.title}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default Collections
