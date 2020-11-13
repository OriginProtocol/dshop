import React, { useState } from 'react'

import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useProduct from 'utils/useProduct'
import useIsMobile from 'utils/useIsMobile'
import useConfig from 'utils/useConfig'
import usePaymentDiscount from 'utils/usePaymentDiscount'
import Link from 'components/Link'

import ProductOptions from '../../shared/ProductOptions'

const Product = ({ match }) => {
  const { config } = useConfig()
  const isMobile = useIsMobile()
  const [{ cart }, dispatch] = useStateValue()
  const productObj = useProduct(match.params.id)
  const { product, variant, loading } = productObj

  const { paymentDiscount } = usePaymentDiscount()

  if (loading || !product) {
    return null
  }

  const addedToCart = Boolean(
    get(cart, 'items', []).find(
      (item) =>
        item.product === match.params.id &&
        String(item.variant) === String(variant.id)
    )
  )
  const isOutOfStock = config.inventory && Number(variant.quantity) <= 0

  const Images = () =>
    product.imageUrls.map((image, idx) => <img key={idx} src={image} />)

  const btnCls = 'btn sm:px-12 text-xl block text-center sm:inline mt-4'
  const Details = () => (
    <>
      <div className="text-4xl sm:text-5xl leading-none">{product.title}</div>
      <div className="mt-4 text-4xl font-bold mb-4">
        {get(variant, 'priceStr', 'Unavailable')}
      </div>
      {!paymentDiscount || !paymentDiscount.data ? null : (
        <div className="border-t border-b border-gray-200 py-2 text-center">
          {paymentDiscount.data.summary}
        </div>
      )}

      <ProductOptions
        {...productObj}
        labelClassName="my-2 font-bold text-white"
        className="border border-gray-200 bg-black text-white"
      />
      {addedToCart ? (
        <Link to="/cart" className={btnCls}>
          View Cart
        </Link>
      ) : (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (isOutOfStock) return
            dispatch({ type: 'addToCart', product, variant })
          }}
          className={`${btnCls} ${isOutOfStock ? 'opacity-50' : ''}`}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Out of stock' : 'Add to Cart'}
        </a>
      )}
    </>
  )
  if (isMobile) {
    return (
      <>
        <div className="container my-8">
          <Details />
        </div>
        <Images />
        <div
          className="container mt-12 mb-24 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </>
    )
  }
  return (
    <div className="container mt-16 flex flex-row">
      <div className="mb-10 grid gap-12" style={{ flex: '1' }}>
        <Images />
      </div>
      <div className="sm:ml-24" style={{ flex: '1' }}>
        <Details />
        <div
          className="mt-12 mb-24 whitespace-pre-line text-2xl"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
    </div>
  )
}

export default Product
