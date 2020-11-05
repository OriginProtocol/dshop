import React, { useState } from 'react'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'
import usePaymentDiscount from 'utils/usePaymentDiscount'

import Link from 'components/Link'

import Products from './_Products'

const Product = ({ match }) => {
  const { config } = useConfig()
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const { product, variant, loading } = useProduct(match.params.id)

  const { paymentDiscount } = usePaymentDiscount()

  if (loading) {
    return null
  }

  const isOutOfStock = config.inventory && Number(variant.quantity) <= 0
  const relPath =
    product.imageUrl || `${config.backend}/images/default-image.svg`
  return (
    <div className="container mt-8 sm:mt-16">
      <div className="flex flex-col sm:flex-row">
        <div className="mb-10" style={{ flex: '2' }}>
          <img src={relPath} />
        </div>
        <div className="sm:ml-24" style={{ flex: '3' }}>
          <div className="text-center sm:text-left text-3xl sm:text-4xl font-semibold leading-none text-header">
            {product.title}
          </div>
          <div className="text-center sm:text-left mt-4 text-lg mb-6">
            {variant.priceStr}
          </div>
          {!paymentDiscount || !paymentDiscount.data ? null : (
            <div className="border-t border-b border-gray-200 py-2 text-center">
              {paymentDiscount.data.summary}
            </div>
          )}
          {addedToCart ? (
            <Link
              to="/cart"
              className="btn btn-primary sm:px-32 mt-6 block sm:inline-block"
            >
              View Cart
            </Link>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (isOutOfStock) return
                dispatch({ type: 'addToCart', product, variant })
                setAddedToCart(true)
              }}
              className={`btn btn-primary sm:px-32 block sm:inline-block mt-6 ${
                isOutOfStock ? 'opacity-50' : ''
              }`}
              disabled={isOutOfStock}
            >
              {isOutOfStock ? 'Out of stock' : 'Add to Cart'}
            </a>
          )}
          <div
            className="my-12 sm:mb-24 whitespace-pre-line text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      </div>
      <div className="mt-24 mb-10 sm:mb-6 text-3xl sm:text-4xl text-center sm:text-left font-medium text-header">
        You might also like
      </div>
      <Products limit={3} />
    </div>
  )
}

export default Product
