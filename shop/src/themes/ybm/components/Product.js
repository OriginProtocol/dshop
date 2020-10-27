import React, { useState } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useCollection from 'utils/useCollection'
import useThemeVars from 'utils/useThemeVars'

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
  const themeVars = useThemeVars()
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

  const alignLeft = get(themeVars, 'product.textAlign') === 'Left'
  const align = alignLeft ? '' : 'text-center'

  const galleryLeft = get(themeVars, 'product.galleryPosition') === 'Left'
  const optionButtons = get(themeVars, 'product.optionStyle') === 'Buttons'
  const first = galleryLeft ? '' : 'order-2 sm:order-1'
  const second = galleryLeft ? 'sm:mr-12' : 'order-1 sm:order-2 sm:ml-12'

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
              scrollToTop={false}
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
              scrollToTop={false}
            >
              Next
            </Link>
          ) : (
            <div className="sm:ml-8 opacity-50">Next</div>
          )}
        </div>
      </div>
      <div className="sm:container flex flex-col sm:flex-row my-8 sm:my-12">
        <div className={`sm:mb-10 flex-1 min-w-0 ${second}`}>
          <Gallery
            product={product}
            active={activeImage}
            onChange={productObj.setOptionFromImage}
          />
        </div>
        <div className={`px-3 sm:px-0 flex-1 min-w-0 ${first} ${align}`}>
          <div className="text-2xl sm:text-3xl leading-none mt-4">
            {product.title}
          </div>
          <div className="mt-4 text-lg mb-12 font-bold">
            {get(variant, 'priceStr', 'Unavailable')}
          </div>
          {optionButtons ? (
            <ProductOptionsAlt {...productObj} center={!alignLeft} />
          ) : (
            <ProductOptions {...productObj} center={!alignLeft} />
          )}

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
      </div>
    </div>
  )
}

const ProductOptions = ({
  variants,
  product,
  options,
  setOption,
  getOptions,
  center
}) => {
  const productOptions = get(product, 'options', [])
  if (variants.length <= 1 || !productOptions.length) {
    return null
  }
  const justify = center ? ' justify-center' : ''

  return (
    <div className={`flex mb-8 flex-col sm:flex-row${justify}`}>
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

const ProductOptionsAlt = ({
  variants,
  product,
  options,
  setOption,
  getOptions,
  center
}) => {
  const productOptions = get(product, 'options', [])
  if (variants.length <= 1 || !productOptions.length) {
    return null
  }
  const colors = get(product, 'colors', {})
  const items = center ? ' items-center ' : ''

  return (
    <div className={`flex flex-col ${items}justify-center mb-4`}>
      {productOptions.map((opt, idx) => (
        <React.Fragment key={`${product.id}-${idx}`}>
          <div className="text-xl text-gray-600">{opt}</div>
          <div className="flex mt-2 mb-8">
            <div className="grid grid-flow-col gap-8 text-xl">
              {getOptions(product, idx).map((item, optIdx) => {
                const active = options[`option${idx + 1}`] === item
                if (opt.match(/^colou?r$/i) && colors[item]) {
                  const border = active ? 'border-black' : 'border-white'
                  return (
                    <a
                      key={optIdx}
                      className={`rounded-full border p-1 ${border}`}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setOption(idx + 1, item)
                      }}
                    >
                      <div
                        className="rounded-full w-6 h-6"
                        style={{ backgroundColor: colors[item] }}
                      />
                    </a>
                  )
                }
                return (
                  <a
                    key={optIdx}
                    className={active ? 'border-b border-black' : ''}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setOption(idx + 1, item)
                    }}
                    children={item}
                  />
                )
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export default Product
