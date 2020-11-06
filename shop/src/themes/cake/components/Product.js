import React, { useMemo, useState } from 'react'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useCollections from 'utils/useCollections'
import useCollection from 'utils/useCollection'
import useConfig from 'utils/useConfig'
import usePaymentDiscount from 'utils/usePaymentDiscount'
import Link from 'components/Link'
import Caret from 'components/icons/Caret'

import Products from './_Products'

const RightCaret = () => (
  <div
    className="d-flex items-center"
    style={{
      transform: 'rotateZ(270deg)',
      padding: '0 5px'
    }}
  >
    <Caret />
  </div>
)

const Product = ({ match }) => {
  const { config } = useConfig()
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const productId = match.params.id
  const { product, variant, loading } = useProduct(productId)
  const { collections } = useCollections()

  const activeCollectionId = useMemo(() => {
    const collection = collections.find((coll) =>
      coll.products.find((p) => p && p.id === productId)
    )
    return collection ? collection.id : null
  }, [collections, productId])

  const { collection, nextProduct, previousProduct } = useCollection(
    activeCollectionId
  )

  const { paymentDiscount } = usePaymentDiscount()

  if (loading) {
    return null
  }
  const isOutOfStock = config.inventory && Number(variant.quantity) <= 0

  return (
    <>
      <div className="container mt-8 sm:mt-16">
        <div className="flex flex-col sm:flex-row content-between mb-5">
          <div className="flex-1 flex items-center">
            <Link className="" to="/">
              Home
            </Link>{' '}
            <RightCaret />
            <Link to="/products">All Products</Link> <RightCaret />
            {!collection ? null : (
              <Link to={`/products/${collection.id}`}>{collection.title}</Link>
            )}
          </div>
          <div className="flex-1 text-right">
            {!previousProduct ? null : (
              <Link className="mr-3" to={`/product/${previousProduct.id}`}>
                Previous
              </Link>
            )}
            {previousProduct && nextProduct ? ` | ` : ''}
            {!nextProduct ? null : (
              <Link className="mr-3" to={`/product/${nextProduct.id}`}>
                Next
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="mb-10" style={{ flex: '2' }}>
            <img src={product.imageUrl} />
          </div>
          <div className="sm:ml-24" style={{ flex: '3' }}>
            <div className="text-center sm:text-left text-3xl sm:text-4xl font-semibold leading-none font-header">
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
            <div
              className="mt-6 mb-24 whitespace-pre-line text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
            {addedToCart ? (
              <Link to="/cart" className="btn btn-primary px-32 bg-button">
                View Cart
              </Link>
            ) : (
              <button
                onClick={() => {
                  dispatch({ type: 'addToCart', product, variant })
                  setAddedToCart(true)
                }}
                className={`btn btn-primary sm:px-32 bg-button ${
                  isOutOfStock ? 'opacity-50' : ''
                }`}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? 'Out of stock' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
        <div className="mt-24 mb-6 text-4xl font-header text-center">
          You might also like
        </div>
        <Products limit={3} />
      </div>
    </>
  )
}

export default Product
