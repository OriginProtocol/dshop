import React, { useEffect, useState } from 'react'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import fetchProduct from 'data/fetchProduct'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import Link from 'components/Link'
import CloseIcon from 'components/icons/Close'

const EmptyCart = () => (
  <div className="flex flex-col items-center mt-12 mb-32">
    <div className="mb-12 text-center text-3xl sm:text-4xl leading-none font-medium">
      Your cart is empty
    </div>
    <Link to="/" className="btn btn-primary">
      Continue Shopping
    </Link>
  </div>
)

const Cart = () => {
  const [{ cart }, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  if (!cart.items.length) {
    return <EmptyCart />
  }

  return (
    <div className="container my-12">
      <div className="mb-12 text-center sm:text-left text-3xl sm:text-4xl leading-none font-medium">
        Shopping Cart
      </div>
      <div
        className="grid gap-y-2 text-sm sm:text-lg"
        style={{ gridTemplateColumns: 'auto auto auto' }}
      >
        <div className="text-gray-500 text-sm">Item</div>
        <div className="text-gray-500 text-sm text-center">Quantity</div>
        <div className="text-gray-500 text-sm text-right">Price</div>
        {cart.items.map((item) => (
          <Row
            key={`${item.product}-${item.variant}`}
            item={item}
            price={formatPrice(item.price * (item.quantity || 1), currencyOpts)}
            onRemove={() => dispatch({ type: 'removeFromCart', item })}
          />
        ))}
      </div>
      <div className="text-right text-lg sm:text-xl pt-6 font-semibold border-t dark:border-gray-600">
        {`Subtotal: ${formatPrice(cart.subTotal, currencyOpts)}`}
      </div>
      <div className="mt-12 flex justify-center sm:justify-end">
        <Link
          to="/checkout"
          className="btn btn-primary sm:px-24 w-full sm:w-auto text-center"
        >
          Checkout
        </Link>
      </div>
    </div>
  )
}

const Row = ({ item, price, onRemove }) => {
  const { config } = useConfig()
  const [product, setProduct] = useState()
  const [, dispatch] = useStateValue()

  useEffect(() => {
    fetchProduct(config.dataSrc, item.product).then(setProduct)
  }, [item.product])

  if (!product) return null

  let variant = product.variants.find((v) => v.id === item.variant)
  if (!variant) {
    variant = product
  }

  let maxQuantity = 10
  if (!Number.isNaN(variant.quantity)) {
    maxQuantity = Number(variant.quantity)
  } else if (!Number.isNaN(product.maxQuantity)) {
    maxQuantity = Number(product.maxQuantity)
  }

  maxQuantity = Math.min(10, maxQuantity)

  const quantities = Array.from(Array(maxQuantity)).map((i, idx) => idx + 1)

  return (
    <>
      <div className="border-t py-6 dark:border-gray-600">
        <div className="flex items-center font-semibold">
          <img className="w-8 sm:w-16 mr-5 sm:mr-10" src={item.imageUrl} />
          <div>
            <div className="flex items-center">
              {item.title}
              <a
                href="#"
                className="ml-3 hover:opacity-50"
                onClick={(e) => {
                  e.preventDefault()
                  onRemove()
                }}
              >
                <CloseIcon />
              </a>
            </div>
            {!item.options ? null : (
              <div className="flex text-gray-600 text-sm font-normal">
                {item.options.map((opt, idx) => (
                  <span key={idx} className="mr-4">
                    {opt}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t py-6 flex items-center justify-center dark:border-gray-600">
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
      </div>
      <div className="border-t py-6 flex items-center justify-end dark:border-gray-600">
        {price}
      </div>
    </>
  )
}
export default Cart
