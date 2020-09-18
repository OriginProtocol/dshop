import React, { useEffect, useState } from 'react'
import { useLocation, useRouteMatch } from 'react-router-dom'
import queryString from 'query-string'
import get from 'lodash/get'

import useOrigin from 'utils/useOrigin'
import { useStateValue } from 'data/state'
import formatAddress from 'utils/formatAddress'

import Link from 'components/Link'

import OrderSummary from './checkout/_Summary'

const Order = () => {
  const { getOffer, status } = useOrigin()
  const [cart, setCart] = useState()
  const [, setError] = useState()
  const [loading, setLoading] = useState()
  const [, dispatch] = useStateValue()
  const match = useRouteMatch('/order/:tx')
  const location = useLocation()
  const opts = queryString.parse(location.search)

  useEffect(() => {
    async function go() {
      const { tx } = match.params
      const result = await getOffer({ tx, password: opts.auth })
      if (result) {
        setCart(result.cart)
        setError(false)
        dispatch({ type: 'orderComplete' })
      } else {
        setError(true)
      }
      setLoading(false)
    }
    if (getOffer && !cart && !loading && status !== 'loading') {
      setLoading(true)
      go()
    }
  }, [match.params.tx, opts.auth, status])

  if (loading || !cart) return 'Loading'

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white">
        <div className="container pt-24 pb-10">
          <div className="text-2xl font-medium">The Peer Art</div>
        </div>
      </div>
      <div className="border-t" />
      <div className="container pt-10 pb-24">
        <div className="text-3xl font-medium">
          {`Thank you, ${get(cart, 'userInfo.firstName')}!`}
          <span className="text-green-400 ml-2">Your order is confirmed.</span>
        </div>
        <div className="text-gray-500 border-b border-black text-sm pb-4 pt-2">
          You’ll receive an email when your order is ready.
        </div>
        <div className="flex mt-12">
          <div style={{ flex: 3 }}>
            <div className="text-lg mb-2 font-medium">Customer Information</div>
            <div className="shadow-lg px-4 bg-white text-sm grid grid-cols-2 gap-8 py-6">
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Contact Information</div>
                <div>{get(cart, 'userInfo.email')}</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Payment method</div>
                <div>{get(cart, 'paymentMethod.label')}</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Shipping Address</div>
                <div>
                  {formatAddress(cart.userInfo).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Billing Address</div>
                <div>
                  {formatAddress(
                    cart.userInfo,
                    cart.userInfo.billingDifferent ? 'billing' : null
                  ).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Shipping method</div>
                <div>{get(cart, 'shipping.label')}</div>
              </div>
            </div>
            <div className="flex items-center mt-8 justify-between">
              <div className="text-lg">
                Need Help? <span className="underline">Contact Us</span>
              </div>
              <Link className="btn btn-primary" to="/">
                Continue Shopping
              </Link>
            </div>
          </div>
          <div style={{ flex: 2 }} className="ml-12">
            <OrderSummary cart={cart} discount={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Order
