import React, { useState } from 'react'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'

import Link from 'components/Link'

import Header from './_Header'
import Footer from './_Footer'

const Product = ({ match }) => {
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const { product, variant, loading } = useProduct(match.params.id)

  if (loading) {
    return null
  }

  return (
    <div className="container py-20">
      <Header />
      <div className="mt-8 sm:mt-16">
        <div className="flex flex-col sm:flex-row">
          <div className="mb-10 grid gap-12" style={{ flex: '1' }}>
            {product.imageUrls.map((image, idx) => (
              <img key={idx} src={image} />
            ))}
          </div>
          <div className="sm:ml-24" style={{ flex: '1' }}>
            <div className="text-center sm:text-left text-4xl sm:text-5xl leading-none">
              {product.title}
            </div>
            <div className="text-center sm:text-left mt-4 text-4xl font-bold mb-8">
              {variant.priceStr}
            </div>

            {addedToCart ? (
              <Link to="/cart" className="btn sm:px-12 text-xl">
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
                className="btn sm:px-12 text-xl"
              >
                Add to Cart
              </a>
            )}
            <div
              className="mt-12 mb-24 whitespace-pre-line text-sm sm:text-2xl"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Product
