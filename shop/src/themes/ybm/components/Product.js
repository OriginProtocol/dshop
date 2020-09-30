import React, { useState, useContext } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useCollection from 'utils/useCollection'
import useIsMobile from 'utils/useIsMobile'

import Header from './_Header'
import Footer from './_Footer'

import Link from 'components/Link'
import {
  GalleryMobile,
  GalleryContext,
  GalleryProvider
} from 'components/GalleryMobile'

const Product = ({ ...props }) => (
  <>
    <Header />
    <ProductDetail {...props} />
    <Footer />
  </>
)

const GalleryTicks = ({ pics }) => {
  const [state] = useContext(GalleryContext)
  return (
    <div className="flex gap-2 justify-center">
      {pics.map((pic, idx) => (
        <div
          className={`w-2 h-2 border border-black${
            state.active === idx ? ' bg-black' : ''
          }`}
          key={idx}
          onClick={() => {
            const width = state.scrollEl.current.clientWidth
            state.scrollEl.current.scrollTo(width * idx, 0)
          }}
        />
      ))}
    </div>
  )
}

const ProductDetail = ({ match }) => {
  const isMobile = useIsMobile()
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const collectionObj = useCollection(match.params.collection, {
    product: match.params.id,
    includeAll: 'All Products'
  })
  const { collection, previousProduct, nextProduct } = collectionObj
  const { product, variant, loading } = useProduct(match.params.id)

  if (loading) {
    return <div className="min-h-screen" />
  }

  const colLink = collection ? `/collections/${collection.id}` : ''

  return (
    <div className="mt-8 sm:mt-24">
      <div className="container flex text-sm justify-between">
        <div className="gap-2 hidden sm:flex">
          <Link to={colLink || '/products'} className="text-gray-600">
            {get(collection, 'title', 'All Products')}
          </Link>
          <div className="text-gray-600 text-xs">&gt;</div>
          <div>{product.title}</div>
        </div>
        <div className="flex gap-8 text-gray-600 justify-between flex-1 sm:flex-none">
          {previousProduct ? (
            <Link to={`${colLink}/product/${previousProduct}`}>Previous</Link>
          ) : (
            <div>Previous</div>
          )}
          {nextProduct ? (
            <Link to={`${colLink}/product/${nextProduct}`}>Next</Link>
          ) : (
            <div>Next</div>
          )}
        </div>
      </div>
      <div className="sm:container flex flex-col sm:flex-row my-8 sm:my-12 gap-12">
        <div className="px-3 sm:px-0 text-center order-2 sm:order-1 flex-1">
          <div className="text-2xl sm:text-3xl leading-none mt-4">
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
        <div className="sm:mb-10 order-1 sm:order-2 flex-1">
          {isMobile ? (
            <>
              <GalleryProvider>
                <GalleryMobile pics={product.imageUrls} />
                <GalleryTicks pics={product.imageUrls} />
              </GalleryProvider>
            </>
          ) : (
            <img src={product.imageUrl} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Product
