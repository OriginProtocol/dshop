import React from 'react'
import { Switch, Route } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

import Link from 'components/Link'
import Information from './Information'
import Shipping from './Shipping'
import Payment from './Payment'
import OrderSummary from './_Summary'

const Checkout = () => {
  const { config } = useConfig()
  const [{ cart }] = useStateValue()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white">
        <div className="container pt-16 pb-8">
          <div className="text-2xl">{config.title}</div>
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
            <OrderSummary cart={cart} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
