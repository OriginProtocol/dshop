import React from 'react'
import queryString from 'query-string'
import get from 'lodash/get'
import fbt from 'fbt'

import Loading from 'components/Loading'
import Link from 'components/Link'
import GalleryScroll from 'components/GalleryScroll'
import Gallery from 'components/GalleryOld'

import SimilarProducts from 'components/SimilarProducts'
import SizeGuide from './product/SizeGuide'
import formatPrice from 'utils/formatPrice'
import useIsMobile from 'utils/useIsMobile'
import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import usePaymentDiscount from 'utils/usePaymentDiscount'
import { isVariantOutOfStock } from '../utils/inventoryUtils'

function getOptions(product, offset) {
  const options = new Set(
    product.variants.map((variant) => variant.options[offset])
  )
  return Array.from(options)
}

const Product = ({ location, match }) => {
  const productObj = useProduct(match.params.id)
  const {
    product,
    setOption,
    variant,
    variants,
    loading,
    activeImage
  } = productObj

  const [{ collections, cart }, dispatch] = useStateValue()
  const isMobile = useIsMobile()
  const { config } = useConfig()
  const currencyOpts = useCurrencyOpts()
  const opts = queryString.parse(location.search)

  const { paymentDiscount } = usePaymentDiscount()

  function addToCart(product, variant) {
    dispatch({ type: 'addToCart', product, variant })
  }

  if (loading) {
    return (
      <div className="product-detail">
        <Loading />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail">
        <fbt desc="product.notFound">Product not found</fbt>
      </div>
    )
  }

  const collectionParam = get(match, 'params.collection')
  const collection = collections.find((c) => c.id === collectionParam)

  const productOptions = get(product, 'options', [])
  let pics = []
  if (config.isAffiliate) {
    pics = product.images.map(
      (i) => `${config.ipfsGateway}${product.data}/orig/${i}`
    )
  } else {
    pics = product.images.map((i) => `${config.dataSrc}${product.id}/orig/${i}`)
  }
  const lg = isMobile ? ' btn-lg' : ''

  const galleryProps = {
    pics,
    active: activeImage,
    onChange: productObj.setOptionFromImage
  }

  const addedToCart = Boolean(
    get(cart, 'items', []).find(
      (item) =>
        item.product === match.params.id &&
        (opts.variant ? String(item.variant) === String(opts.variant) : true)
    )
  )

  const isOutOfStock = isVariantOutOfStock(config, product, variant)

  return (
    <div className="product-detail">
      {!collection ? null : (
        <div className="breadcrumbs">
          <Link to="/">
            <fbt desc="Home">Home</fbt>
          </Link>
          <Link to={`/collections/${collection.id}`}>{collection.title}</Link>
          <span>{product.title}</span>
        </div>
      )}
      <div className="row">
        <div className="col-sm-7">
          {isMobile ? (
            <GalleryScroll {...galleryProps} />
          ) : (
            <Gallery {...galleryProps} />
          )}
        </div>
        <div className="col-sm-5">
          <h3>{product.title}</h3>
          <div className="price mb-4">
            {formatPrice(get(variant, 'price', 0), currencyOpts)}
            {config.freeShipping ? (
              <span className="shipping">
                <fbt desc="product.freeShipping">FREE shipping</fbt>
              </span>
            ) : null}
          </div>
          {!paymentDiscount || !paymentDiscount.data ? null : (
            <div className="payment-discount">
              {paymentDiscount.data.summary}
            </div>
          )}
          {!productOptions || variants.length <= 1 ? null : (
            <div
              className={`product-options${
                productOptions.length <= 1 ? ' inline' : ''
              }`}
            >
              {productOptions.map((opt, idx) => (
                <div key={`${product.id}-${idx}`}>
                  {`${opt}:`}
                  <select
                    className="form-control form-control-sm"
                    value={productObj.options[`option${idx + 1}`] || ''}
                    onChange={(e) => setOption(idx + 1, e.target.value)}
                  >
                    {getOptions(product, idx).map((item, optIdx) => (
                      <option key={optIdx}>{item}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="actions">
            {addedToCart ? (
              <>
                <Link to="/cart" className={`btn btn-primary${lg}`}>
                  <fbt desc="ViewCart">View Cart</fbt>
                </Link>
                {config.singleProduct ? null : (
                  <Link to="/" className={`btn btn-outline-primary${lg}`}>
                    <fbt desc="ContinueShopping">Continue Shopping</fbt>
                  </Link>
                )}
              </>
            ) : variant && !isOutOfStock ? (
              <button
                onClick={() => {
                  if (config.isAffiliate) {
                    window.open(product.link)
                  } else {
                    addToCart(product, variant)
                  }
                }}
                className={`btn btn-outline-primary${lg}`}
              >
                {config.isAffiliate ? (
                  <fbt desc="ViewProduct">View Product</fbt>
                ) : (
                  <fbt desc="AddToCart">Add to Cart</fbt>
                )}
              </button>
            ) : (
              <button className={`btn btn-outline-primary disabled${lg}`}>
                <fbt desc="Unavailable">Unavailable</fbt>
              </button>
            )}
          </div>
          <div
            className="mt-4 description"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
          <SizeGuide product={product} wide={false} />
        </div>
      </div>
      <SizeGuide product={product} wide={true} />
      {!product.descriptionLong ? null : (
        <div
          className="mt-4"
          dangerouslySetInnerHTML={{
            __html: product.descriptionLong.replace(/\n/g, '<br/>')
          }}
        />
      )}
      <SimilarProducts product={product} count={isMobile ? 4 : 3} />
    </div>
  )
}

export default Product

require('react-styl')(`
  .product-detail
    border-top: 1px solid #eee
    padding-top: 2rem
    .breadcrumbs
      margin-top: -1rem
    .product-options
      display: flex
      margin-bottom: 2rem
      .form-control
        width: auto
      > div
        margin-right: 1rem
        display: flex
        flex-direction: column
        &:last-of-type
          margin-right: 0
      &.inline > div
        flex-direction: row
        align-items: center
        select
          margin-left: 0.5rem
    .price
      font-size: 1.25rem
      .shipping
        opacity: 0.6
        font-weight: normal
        margin-left: 1rem
        font-size: 1rem
    .byline
      opacity: 0.6
    .actions
      *
        margin-right: 0.5rem
    .description
      white-space: pre-line
    .payment-discount
      text-align: center
      padding: 10px
      margin: 10px 0 1rem 0
      border-top: solid 1px #dddddd
      border-bottom: solid 1px #dddddd
      font-size: 1.125rem
  @media (max-width: 767.98px)
    .product-detail
      h3,.price,.actions
        text-align: center
      .product-options
        justify-content: center
        text-align: center
      .actions
        display: flex
        flex-direction: column
        justify-content: center
        *
          margin-bottom: 0.5rem
`)
