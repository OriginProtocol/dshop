import React, { useState } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useCollection from 'utils/useCollection'

import Header from './_Header'
import Footer from './_Footer'
import Gallery from '../../shared/Gallery'

import Link from 'components/Link'

const Product = ({ ...props }) => (
  <>
    <Header />
    <ProductDetail {...props} />
    <Footer />
  </>
)

const ProductDetail = ({ match }) => {
  const [addedToCart, setAddedToCart] = useState()
  const [, dispatch] = useStateValue()
  const collectionObj = useCollection(match.params.collection, {
    product: match.params.id,
    includeAll: 'All Products'
  })

  const { collection, previousProduct, nextProduct } = collectionObj
  const productObj = useProduct(match.params.id)
  const { product, variant, loading, activeImage } = productObj

  if (loading) {
    return <div className="min-h-screen" />
  }
  if (!product) {
    return (
      <div className="text-center my-32">
        <div className="text-3xl mb-12">Product not found</div>
        <Link to="/" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    )
  }

  const colLink = collection ? `/collections/${collection.id}` : ''

  return (
    <div className="mt-8 sm:mt-24">
      <div className="container flex text-sm justify-between">
        <div className="hidden sm:grid grid-flow-col gap-2">
          <Link
            to={colLink || '/products'}
            className="text-gray-600 hover:text-black"
          >
            {get(collection, 'title', 'All Products')}
          </Link>
          <div className="text-gray-600 text-xs">&gt;</div>
          <div>{product.title}</div>
        </div>
        <div className="flex text-gray-600 justify-between flex-1 sm:flex-none">
          {previousProduct ? (
            <Link
              className="hover:text-black"
              to={`${colLink}/product/${previousProduct}`}
            >
              Previous
            </Link>
          ) : (
            <div className="opacity-50">Previous</div>
          )}
          {nextProduct ? (
            <Link
              className="sm:ml-8 hover:text-black"
              to={`${colLink}/product/${nextProduct}`}
            >
              Next
            </Link>
          ) : (
            <div className="sm:ml-8 opacity-50">Next</div>
          )}
        </div>
      </div>
      <div className="sm:container flex flex-col sm:flex-row my-8 sm:my-12">
        <div className="px-3 sm:px-0 text-center order-2 sm:order-1 flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl leading-none mt-4">
            {product.title}
          </div>
          <div className="mt-4 text-lg mb-12 font-bold">
            {get(variant, 'priceStr', 'Unavailable')}
          </div>
          <ProductOptions {...productObj} />
          {!variant ? (
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="btn btn-primary sm:px-16 block sm:inline-block opacity-50"
            >
              Unavailable
            </a>
          ) : addedToCart ? (
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
          <div
            className="my-12 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
        <div className="sm:ml-12 sm:mb-10 order-1 sm:order-2 flex-1 min-w-0">
          <Gallery
            product={product}
            active={activeImage}
            onChange={productObj.setOptionFromImage}
          />
        </div>
      </div>
    </div>
  )
}

const ProductOptions = ({
  variants,
  product,
  options,
  setOption,
  getOptions
}) => {
  const productOptions = get(product, 'options', [])
  if (variants.length <= 1 || !productOptions.length) {
    return null
  }

  return (
    <div className="flex justify-center mb-8">
      {productOptions.map((opt, idx) => (
        <div key={`${product.id}-${idx}`} className="font-2xl">
          <div className="mb-2 text-gray-600">{opt}</div>
          <select
            className={`border p-3 border-black bg-orange-100${
              idx > 0 ? ' ml-4' : ''
            }`}
            value={options[`option${idx + 1}`] || ''}
            onChange={(e) => setOption(idx + 1, e.target.value)}
          >
            {getOptions(product, idx).map((item, idx) => (
              <option key={idx}>{item}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

export default Product
