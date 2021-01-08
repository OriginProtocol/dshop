import React from 'react'

import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import useProducts from 'utils/useProducts'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

const Products = ({ limit = Infinity }) => {
  const { config } = useConfig()
  const { products } = useProducts()
  const currencyOpts = useCurrencyOpts()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-12">
      {products.slice(0, limit).map((product) => {
        const relPath =
          product.imageUrl || `${config.backend}/images/default-image.svg`
        const isOutOfStock = config.inventory && Number(product.quantity) <= 0
        return (
          <Link key={product.id} to={`/product/${product.id}`}>
            <div
              className="w-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${relPath})`,
                backgroundSize: product.imageUrl ? undefined : '100px',
                backgroundColor: product.imageUrl ? undefined : '#cbd5e0',
                paddingTop: '100%'
              }}
            />
            <div className="mt-6 font-bold">{product.title}</div>
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
