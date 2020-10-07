import React from 'react'

import { useStateValue } from 'data/state'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import Link from 'components/Link'
import CloseIcon from 'components/icons/Close'

const Cart = () => {
  const [{ cart }, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  return (
    <>
      <div className="container mt-12">
        <div className="mb-12 text-center sm:text-left text-3xl sm:text-4xl leading-none font-bold font-serif">
          Shopping Cart{' '}
          <span className="text-red-500">({cart.items.length})</span>
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
              img={item.imageUrl}
              title={item.title}
              quantity={item.quantity}
              price={formatPrice(item.price, currencyOpts)}
              onRemove={() => dispatch({ type: 'removeFromCart', item })}
            />
          ))}
        </div>
        <div className="text-right text-lg sm:text-xl pt-6 font-semibold border-t">
          {`Subtotal: ${formatPrice(cart.subTotal, currencyOpts)}`}
        </div>
        <div className="mt-12 flex justify-center sm:justify-end">
          <Link to="/checkout" className="btn btn-primary px-24">
            Checkout
          </Link>
        </div>
      </div>
    </>
  )
}

const Row = ({ title, quantity, img, price, onRemove }) => (
  <>
    <div className="border-t py-6">
      <div className="flex items-center font-semibold">
        <img className="w-8 sm:w-16 mr-5 sm:mr-10" src={img} />
        {title}
        <a
          href="#"
          className="ml-3"
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
        >
          <CloseIcon />
        </a>
      </div>
    </div>
    <div className="border-t py-6 flex items-center justify-center">
      {quantity}
    </div>
    <div className="border-t py-6 flex items-center justify-end">{price}</div>
  </>
)

export default Cart
