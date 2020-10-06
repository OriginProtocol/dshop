import React from 'react'

import Link from 'components/Link'

import useProducts from 'utils/useProducts'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

const Products = ({ limit = Infinity, collection, sort }) => {
  const { products } = useProducts({ collection, sort, limit })
  const currencyOpts = useCurrencyOpts()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
      {products.map((product) => (
        <Link
          key={product.id}
          to={`${collection ? `/collections/${collection}` : ''}/product/${
            product.id
          }`}
          className="text-center sm:text-left font-medium text-xl"
        >
          <div
            className="w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${product.imageUrl})`,
              paddingTop: '100%'
            }}
          />
          <div className="px-4 sm:px-0">
            <div className="mt-6 leading-tight">{product.title}</div>
            <div className="mt-2 font-bold">
              {formatPrice(product.price, currencyOpts)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default Products
