import React from 'react'
import { Switch, Route } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import formatPrice from 'utils/formatPrice'

import Link from 'components/Link'
import Information from './Information'
import Shipping from './Shipping'
import Payment from './Payment'

const Checkout = () => {
  const [{ cart }] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white">
        <div className="container pt-16 pb-8">
          <div className="text-2xl">The Peer Art</div>
        </div>
      </div>
      <div className="border-t" />
      <div className="container pt-8 pb-24">
        <Link className="text-sm" to="/cart">
          &laquo; Return to cart
        </Link>
        <div className="text-4xl mt-3 mb-6">Checkout</div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-12">
          <div className="border-t py-2 border-black">
            Contact &amp; Shipping Address
          </div>
          <div className="border-t py-2 text-gray-500">Shipping Method</div>
          <div className="border-t py-2 text-gray-500">Payment</div>
        </div>

        <div className="flex">
          <Switch>
            <Route path="/checkout/shipping" component={Shipping} />
            <Route path="/checkout/payment/:intentId?" component={Payment} />
            <Route path="/checkout" component={Information} />
          </Switch>

          <div style={{ flex: 2 }} className="ml-12">
            <div className="text-lg mb-2">Order Summary</div>
            <div className="shadow-lg p-4 bg-white text-sm">
              <div
                className="grid gap-y-2"
                style={{ gridTemplateColumns: 'auto auto auto' }}
              >
                {cart.items.map((item) => (
                  <Row
                    key={`${item.product}-${item.variant}`}
                    img="peer-art/mool-c26/520/upload_2e596930586d9b842fc35efac45cfded"
                    title={item.title}
                    quantity={item.quantity}
                    price={formatPrice(item.price, currencyOpts)}
                  />
                ))}
              </div>
              <div className="mt-4">Discount code</div>
              <div className="flex justify-between text-lg pt-4 border-b pb-4">
                <input className="border px-2 py-2 bg-gray-100 w-full" />
                <button className="btn ml-2 py-2 text-sm">Apply</button>
              </div>
              <div className="flex justify-between mt-4">
                <div>Subtotal</div>
                <div>{formatPrice(cart.subTotal, currencyOpts)}</div>
              </div>
              <div className="flex justify-between mt-4">
                <div>Shipping</div>
                <div>Calculated at next step</div>
              </div>
              <div className="flex justify-between mt-4 border-t text-lg pt-4">
                <div>Total</div>
                <div>{formatPrice(cart.total, currencyOpts)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Row = ({ title, quantity, img, price }) => (
  <>
    <div className="border-b pb-3">
      <div className="flex items-center text-sm font-semibold">
        <img className="h-16 mr-5" src={img} />
        {title}
      </div>
    </div>
    <div className="border-b pb-3 text-sm flex items-center justify-center">
      {quantity}
    </div>
    <div className="border-b pb-3 text-sm flex items-center justify-end">
      {price}
    </div>
  </>
)

export default Checkout
