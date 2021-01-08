import React from 'react'

import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import useProducts from 'utils/useProducts'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

const Products = ({ limit = Infinity, collection, sort }) => {
  const { config } = useConfig()
  const { products } = useProducts({ collection, sort, limit })
  const currencyOpts = useCurrencyOpts()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
      {products.map((product) => {
        const relPath =
          product.imageUrl || `${config.backend}/images/default-image.svg`
        const isOutOfStock = config.inventory && Number(product.quantity) <= 0
        return (
          <Link
            key={product.id}
            to={`${collection ? `/collections/${collection}` : ''}/product/${
              product.id
            }`}
            className={`text-center sm:text-left font-medium text-xl ${
              isOutOfStock ? 'opacity-50' : ''
            }`}
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
              <div className="mt-6 leading-tight">{product.title}</div>
              <div className="mt-2 flex font-bold">
                {formatPrice(product.price, currencyOpts)}
                {!isOutOfStock ? null : (
                  <div className="text-red-500 ml-2">Out of stock</div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default Products
