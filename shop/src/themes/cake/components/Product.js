import React, { useMemo, useState } from 'react'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useCollections from 'utils/useCollections'
import useCollection from 'utils/useCollection'

import Link from 'components/Link'

import Products from './_Products'

const Product = ({ match }) => {
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

  if (loading) {
    return null
  }

  return (
    <>
      <div className="container mt-8 sm:mt-16">
        <div className="flex flex-col sm:flex-row content-between mb-5">
          <div className="flex-1">
            <Link className="" to="/">
              Home
            </Link>{' '}
            &raquo;
            <Link className="ml-3" to="/products">
              All Products
            </Link>{' '}
            &raquo;
            {!collection ? null : (
              <Link className="ml-3" to={`/products/${collection.id}`}>
                {collection.title}
              </Link>
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
            <div className="text-center sm:text-left text-3xl sm:text-4xl font-semibold leading-none">
              {product.title}
            </div>
            <div className="text-center sm:text-left mt-4 text-lg mb-12">
              {variant.priceStr}
            </div>
            <div
              className="mb-24 whitespace-pre-line text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
            {addedToCart ? (
              <Link to="/cart" className="btn btn-primary px-32">
                View Cart
              </Link>
            ) : (
              <button
                onClick={() => {
                  dispatch({ type: 'addToCart', product, variant })
                  setAddedToCart(true)
                }}
                className="btn btn-primary sm:px-32"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
        <div className="mt-24 mb-6 text-4xl font-serif text-center">
          You might also like
        </div>
        <Products limit={3} />
      </div>
    </>
  )
}

export default Product
