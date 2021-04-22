import React, { useEffect } from 'react'

import VariantPic from 'components/VariantPic'
import VariantOptions from 'components/VariantOptions'

import formatPrice from 'utils/formatPrice'
import useProduct from 'utils/useProduct'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import { isVariantOutOfStock } from 'utils/inventoryUtils'

const CartItem = ({ item }) => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()
  const { product } = useProduct(item.product, item.variant)
  const currencyOpts = useCurrencyOpts()
  let isOutOfStock, variant

  if (product) {
    variant = product.variants.find((v) => v.id === item.variant)
    if (!variant) {
      variant = product
    }

    isOutOfStock = isVariantOutOfStock(config, product, variant)
  }

  useEffect(() => {
    if (isOutOfStock) {
      dispatch({ type: 'setCartOutOfStock', item })
    }
  }, [isOutOfStock])

  if (!product) return null

  return (
    <div className="item">
      <div className="image">
        <VariantPic variant={variant} product={product} />
        <span>{item.quantity}</span>
      </div>
      <div className="title">
        <div>{product.title}</div>
        <VariantOptions variant={variant} product={product} />
        {!isOutOfStock ? null : <div className="text-danger">Out of stock</div>}
      </div>
      <div className="price">
        {formatPrice(item.quantity * variant.price, currencyOpts)}
      </div>
    </div>
  )
}

export default CartItem
