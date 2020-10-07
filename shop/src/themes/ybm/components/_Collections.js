import React from 'react'

import Link from 'components/Link'

import useProducts from 'utils/useProducts'
import useCollections from 'utils/useCollections'

const Collections = ({ limit = Infinity }) => {
  const { visibleCollections } = useCollections()
  const { products } = useProducts()

  const collections = visibleCollections
    .map((collection) => {
      const product = products.find((p) => p.id === collection.products[0])
      return { collection, product }
    })
    .filter((c) => c.product)
    .slice(0, limit)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
      {collections.map(({ product, collection }) => (
        <Link
          key={collection.id}
          to={`/collections/${collection.id}`}
          className="text-center sm:text-left font-medium text-2xl"
        >
          <div
            className="w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${product.imageUrl})`,
              paddingTop: '100%'
            }}
          />
          <div className="px-4 sm:px-0">
            <div className="mt-6 leading-none ">{collection.title}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default Collections
