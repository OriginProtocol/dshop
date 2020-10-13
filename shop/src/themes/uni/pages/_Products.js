import React from 'react'

import Link from 'components/Link'

import useProducts from 'utils/useProducts'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

const Products = ({ limit = Infinity }) => {
  const { products } = useProducts()
  const currencyOpts = useCurrencyOpts()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-12">
      {products.slice(0, limit).map((product) => {
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
