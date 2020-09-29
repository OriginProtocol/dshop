import React, { useState } from 'react'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'

import Link from 'components/Link'

import Products from './_Products'

const Product = ({ match }) => {
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const { product, variant, loading } = useProduct(match.params.id)

  if (loading) {
    return null
  }

  return (
    <div className="container mt-8 sm:mt-24">
      <div className="flex text-sm justify-between">
        <div className="flex gap-2">
          <div className="text-gray-600">New Arrivals</div>
          <div className="text-gray-600 text-xs">&gt;</div>
          <div>{product.title}</div>
        </div>
        <div className="flex gap-8 text-gray-600">
          <div>Previous</div>
          <div>Next</div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row my-12 gap-12">
        <div className="text-center" style={{ flex: '1' }}>
          <div className="text-3xl sm:text-3xl leading-none mt-4">
            {product.title}
          </div>
          <div className="mt-4 text-lg mb-12 font-bold">{variant.priceStr}</div>
          <div
            className="mb-12 sm:mb-24 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          {addedToCart ? (
            <Link
              to="/cart"
              className="btn btn-primary sm:px-16 block sm:inline-block"
            >
              View Cart
            </Link>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                dispatch({ type: 'addToCart', product, variant })
                setAddedToCart(true)
              }}
              className="btn btn-primary sm:px-16 block sm:inline-block"
            >
              Add to Cart
            </a>
          )}
        </div>
        <div className="mb-10" style={{ flex: '1' }}>
          <img src={product.imageUrl} />
        </div>
      </div>
    </div>
  )
}

export default Product
