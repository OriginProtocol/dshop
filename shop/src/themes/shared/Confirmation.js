import React from 'react'
import { useLocation, useRouteMatch } from 'react-router-dom'
import queryString from 'query-string'
import get from 'lodash/get'

import useOrder from 'utils/useOrder'
import useConfig from 'utils/useConfig'
import useIsMobile from 'utils/useIsMobile'
import formatAddress from 'utils/formatAddress'

import Link from 'components/Link'

import { OrderSummary } from './checkout/_Summary'

const Order = () => {
  const isMobile = useIsMobile()
  const match = useRouteMatch('/order/:tx')
  const location = useLocation()
  const opts = queryString.parse(location.search)
  const { loading, order } = useOrder({
    tx: match.params.tx,
    password: opts.auth
  })

  if (loading || !order) return 'Loading'

  if (isMobile) {
    return <OrderMobile order={order} />
  }
  return <OrderDesktop order={order} />
}

const OrderDesktop = ({ order }) => {
  const { config } = useConfig()
  return (
    <div className="min-h-screen dark:bg-black bg-gray-100 dark:text-white">
      <div className="bg-white dark:bg-gray-900">
        <div className="container pt-24 pb-10">
          <div className="text-2xl font-medium">{config.title}</div>
        </div>
      </div>
      <div className="border-t dark:border-gray-700" />
      <div className="container pt-10 pb-24">
        <div className="text-3xl font-medium">
          {`Thank you, ${get(order, 'userInfo.firstName')}!`}
          <span className="text-green-400 ml-2">Your order is confirmed.</span>
        </div>
        <div className="text-gray-500 border-b border-black text-sm pb-4 pt-2">
          You’ll receive an email when your order is ready.
        </div>
        <div className="flex mt-12">
          <div style={{ flex: 3 }}>
            <div className="text-lg mb-2 font-medium">Customer Information</div>
            <div className="shadow-lg px-4 bg-white dark:bg-gray-900 text-sm grid grid-cols-2 gap-8 py-6">
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Contact Information</div>
                <div>{get(order, 'userInfo.email')}</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Payment method</div>
                <div>{get(order, 'paymentMethod.label')}</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Shipping Address</div>
                <div>
                  {formatAddress(order.userInfo).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Billing Address</div>
                <div>
                  {formatAddress(
                    order.userInfo,
                    order.userInfo.billingDifferent ? 'billing' : null
                  ).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="font-medium">Shipping method</div>
                <div>{get(order, 'shipping.label')}</div>
              </div>
            </div>
            <div className="flex items-center mt-8 justify-between">
              <div className="text-lg">
                Need Help?{' '}
                <a href={`mailto:${config.supportEmail}`} className="underline">
                  Contact Us
                </a>
              </div>
              <Link className="btn btn-primary" to="/">
                Continue Shopping
              </Link>
            </div>
          </div>
          <div style={{ flex: 2 }} className="ml-12">
            <OrderSummary cart={order} discount={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

const OrderMobile = ({ order }) => {
  const { config } = useConfig()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="px-8 py-12">
        <div className="text-2xl font-medium">{config.title}</div>
      </div>

      <div className="px-8">
        <div className="text-xl font-medium">
          {`Thank you, ${get(order, 'userInfo.firstName')}!`}
        </div>
        <div className="text-green-400 text-lg font-medium">
          Your order is confirmed.
        </div>
        <div className="text-gray-500 text-sm pt-2 leading-tight">
          You’ll receive an email when your order is ready.
        </div>
      </div>
      <div className="shadow-lg p-8 bg-white mt-8 text-sm">
        <div className="mb-6 font-medium text-base">Customer Information</div>

        <div className="font-medium">Contact Information</div>
        <div className="mb-4">{get(order, 'userInfo.email')}</div>

        <div className="font-medium">Payment method</div>
        <div className="mb-4">{get(order, 'paymentMethod.label')}</div>

        <div className="font-medium">Shipping Address</div>
        <div className="mb-4">
          {formatAddress(order.userInfo).map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>

        {!order.userInfo.billingDifferent ? null : (
          <>
            <div className="font-medium">Billing Address</div>
            <div className="mb-4">
              {formatAddress(
                order.userInfo,
                order.userInfo.billingDifferent ? 'billing' : null
              ).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </>
        )}

        <div className="font-medium">Shipping method</div>
        <div className="mb-4">{get(order, 'shipping.label')}</div>
        <Link className="btn btn-primary w-full block mb-6 mt-8" to="/">
          Continue Shopping
        </Link>
        <div className="text-sm text-center">
          Need Help?{' '}
          <a href={`mailto:${config.supportEmail}`} className="underline">
            Contact Us
          </a>
        </div>
      </div>
      <div className="shadow-lg p-8 bg-white">
        <div className="text-lg mb-6 font-medium">Order Summary</div>
        <OrderSummary cart={order} discount={false} />
      </div>
    </div>
  )
}

export default Order
