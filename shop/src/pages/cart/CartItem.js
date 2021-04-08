import React, { useState, useEffect } from 'react'
import fbt from 'fbt'
import Link from 'components/Link'
import VariantPic from 'components/VariantPic'

import fetchProduct from 'data/fetchProduct'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import formatPrice from 'utils/formatPrice'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import getMaxQuantity from '../../utils/getMaxQuantity'

const CartItem = ({ item }) => {
  const { config } = useConfig()
  const [product, setProduct] = useState()
  const [, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  useEffect(() => {
    fetchProduct(config.dataSrc, item.product).then(setProduct)
  }, [item.product])

  if (!product) return null

  let variant = product.variants.find((v) => v.id === item.variant)
  if (!variant) {
    variant = product
  }

  const maxQuantity = getMaxQuantity(product, variant, config)

  const quantities = Array.from(Array(maxQuantity)).map((i, idx) => idx + 1)

  return (
    <>
      <div className="pic">
        <VariantPic variant={variant} product={product} />
      </div>
      <div className="title">
        <div>
          <Link
            to={{
              pathname: `/products/${product.id}`,
              search: item.variant ? `?variant=${item.variant}` : ''
            }}
          >
            {product.title}
          </Link>
        </div>
        {!variant.options || product.variants.length <= 1 ? null : (
          <div className="cart-options">
            {variant.options.map((opt, idx) => (
              <span key={idx}>{opt}</span>
            ))}
          </div>
        )}
        <div className="mt-2">
          <a
            className="text-danger"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              dispatch({ type: 'removeFromCart', item })
            }}
          >
            <fbt desc="Remove">Remove</fbt>
          </a>
        </div>
      </div>
      <div className="price">{formatPrice(variant.price, currencyOpts)}</div>
      <div className="quantity">
        {quantities.length === 1 ? (
          quantities[0]
        ) : (
          <select
            className="form-control"
            value={item.quantity}
            onChange={(e) => {
              const quantity = Number(e.target.value)
              dispatch({ type: 'updateCartQuantity', item, quantity })
            }}
          >
            {quantities.map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        )}
      </div>
      <div className="total">
        {formatPrice(item.quantity * variant.price, currencyOpts)}
      </div>
    </>
  )
}

export default CartItem

require('react-styl')(`
`)
