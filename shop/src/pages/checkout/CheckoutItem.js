import React, { useState, useEffect } from 'react'

import VariantPic from 'components/VariantPic'
import VariantOptions from 'components/VariantOptions'

import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import fetchProduct from 'data/fetchProduct'
import useCurrencyOpts from 'utils/useCurrencyOpts'

const CartItem = ({ item }) => {
  const { config } = useConfig()
  const [product, setProduct] = useState()
  const currencyOpts = useCurrencyOpts()

  useEffect(() => {
    fetchProduct(config.dataSrc, item.product).then(setProduct)
  }, [item.product])

  if (!product) return null

  let variant = product.variants.find((v) => v.id === item.variant)
  if (!variant) {
    variant = product
  }

  return (
    <div className="item">
      <div className="image">
        <VariantPic variant={variant} product={product} />
        <span>{item.quantity}</span>
      </div>
      <div className="title">
        <div>{product.title}</div>
        <VariantOptions variant={variant} product={product} />
      </div>
      <div className="price">
        {formatPrice(item.quantity * variant.price, currencyOpts)}
      </div>
    </div>
  )
}

export default CartItem
