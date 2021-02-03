import React from 'react'
import queryString from 'query-string'
import pick from 'lodash/pick'
import get from 'lodash/get'
import dayjs from 'dayjs'
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

const Product = ({ history, location, match }) => {
  const [{ collections, cart }, dispatch] = useStateValue()
  const isMobile = useIsMobile()
  const { config } = useConfig()
  const productObj = useProduct(match.params.id)
  const {
    options,
    setOption,
    setState,
    product: productData,
    variant,
    loading,
    activeImage,
    getOptions
  } = productObj
  const currencyOpts = useCurrencyOpts()
  const opts = queryString.parse(location.search)

  const { paymentDiscount } = usePaymentDiscount()

  function addToCart(product, variant) {
    setState({ addedToCart: true })
    dispatch({ type: 'addToCart', product, variant })
  }

  if (loading) {
    return (
      <div className="product-detail">
        <Loading />
      </div>
    )
  }

  if (!productData) {
    return (
      <div className="product-detail">
        <fbt desc="product.notFound">Product not found</fbt>
      </div>
    )
  }

  const collectionParam = get(match, 'params.collection')
  const collection = collections.find((c) => c.id === collectionParam)
  const urlPrefix = collectionParam ? `/collections/${collectionParam}` : ''

  const productOptions = productData.options || []
  let pics = []
  if (config.isAffiliate) {
    pics = productData.images.map(
      (i) => `${config.ipfsGateway}${productData.data}/orig/${i}`
    )
  } else {
    pics = productData.images.map(
      (i) => `${config.dataSrc}${productData.id}/orig/${i}`
    )
  }
  const lg = isMobile ? ' btn-lg' : ''
  let onSale
  if (productData.onSale) {
    const availableDate = dayjs(productData.onSale)
    if (availableDate.isAfter(dayjs())) {
      onSale = (
        <div className="on-sale mb-2">
          <b>On Sale:</b> {availableDate.format('MM-DD-YYYY')}
        </div>
      )
    }
  }

  const galleryProps = {
    pics,
    active: activeImage,
    onChange: (activeId) => {
      const sizeIdx = productOptions.indexOf('Size')
      const foundVariant = productData.variants.find((curVariant) => {
        if (sizeIdx >= 0 && productOptions.length > 1) {
          const sizeMatches =
            variant[`option${sizeIdx + 1}`] ==
            curVariant[`option${sizeIdx + 1}`]
          const matches =
            sizeMatches && curVariant.image === productData.images[activeId]
          return matches
        } else {
          return curVariant.image === productData.images[activeId]
        }
      })
      if (foundVariant !== undefined) {
        setState({
          options: pick(foundVariant, 'option1', 'option2', 'option3')
        })
        history.replace(
          `${urlPrefix}/products/${match.params.id}${
            foundVariant ? `?variant=${foundVariant.id}` : ''
          }`
        )
      }
    }
  }

  const addedToCart = Boolean(
    get(cart, 'items', []).find(
      (item) =>
        item.product === match.params.id &&
        (opts.variant ? String(item.variant) === String(opts.variant) : true)
    )
  )

  const isOutOfStock = config.inventory && Number(variant.quantity) <= 0

  return (
    <div className="product-detail">
      {!collection ? null : (
        <div className="breadcrumbs">
          <Link to="/">
            <fbt desc="Home">Home</fbt>
          </Link>
          <Link to={`/collections/${collection.id}`}>{collection.title}</Link>
          <span>{productData.title}</span>
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
          <h3>{productData.title}</h3>
          {!productData.byline ? null : (
            <div className="byline mb-2">{productData.byline}</div>
          )}
          {!productData.author ? null : (
            <div className="author mb-2">
              {'by '}
              <a href={productData.authorLink}>{productData.author}</a>
            </div>
          )}
          {onSale}
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
          {!productOptions ||
          (productData.variants || []).length <= 1 ? null : (
            <div
              className={`product-options${
                productOptions.length <= 1 ? ' inline' : ''
              }`}
            >
              {productOptions.map((opt, idx) => (
                <div key={`${productData.id}-${idx}`}>
                  {`${opt}:`}
                  <select
                    className="form-control form-control-sm"
                    value={options[`option${idx + 1}`] || ''}
                    onChange={(e) => setOption(idx + 1, e.target.value)}
                  >
                    {getOptions(productData, idx).map((item, idx) => (
                      <option key={idx}>{item}</option>
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
                    window.open(productData.link)
                  } else {
                    addToCart(productData, variant)
                  }
                }}
                className={`btn btn-outline-primary${lg}`}
              >
                {onSale ? (
                  <fbt desc="PreOrder">Pre-Order</fbt>
                ) : config.isAffiliate ? (
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
            dangerouslySetInnerHTML={{ __html: productData.description }}
          />
          <SizeGuide product={productData} wide={false} />
        </div>
      </div>
      <SizeGuide product={productData} wide={true} />
      {!productData.descriptionLong ? null : (
        <div
          className="mt-4"
          dangerouslySetInnerHTML={{
            __html: productData.descriptionLong.replace(/\n/g, '<br/>')
          }}
        />
      )}
      <SimilarProducts product={productData} count={isMobile ? 4 : 3} />
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
