import React from 'react'
import { Switch, Route, useRouteMatch } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import usePGP from 'utils/usePGP'
import useIsMobile from 'utils/useIsMobile'

import Link from 'components/Link'

import { Information, MobileInformation } from './Information'
import { MobileShippingAddress, MobileShipping, Shipping } from './Shipping'
import { Payment, MobilePayment } from './Payment'

import { OrderSummary } from './_Summary'

const Checkout = () => {
  const { config } = useConfig()
  usePGP()
  let currentStep = 1
  if (useRouteMatch('/checkout/shipping')) currentStep = 2
  if (useRouteMatch('/checkout/payment')) currentStep = 3

  const isMobile = useIsMobile()
  const props = { currentStep, config }
  return isMobile ? <Mobile {...props} /> : <Desktop {...props} />
}

const Mobile = ({ config }) => {
  const [{ cart }] = useStateValue()
  return (
    <div className="min-h-screen bg-red-100">
      <div className="p-8 pb-6 pt-10">
        <div className="text-2xl font-medium">{config.title}</div>
      </div>

      <Switch>
        <Route
          path="/checkout/shipping-address"
          component={MobileShippingAddress}
        />
        <Route path="/checkout/shipping" component={MobileShipping} />
        <Route path="/checkout/payment/:intentId?" component={MobilePayment} />
        <Route path="/checkout" component={MobileInformation} />
      </Switch>
      <div className="shadow-lg p-8 bg-white mt-4">
        <div className="text-lg mb-6 font-medium">Order Summary</div>
        <OrderSummary cart={cart} />
      </div>
    </div>
  )
}

const Desktop = ({ currentStep, config }) => {
  const [{ cart }] = useStateValue()

  const Breadcrumb = ({ step, children, to }) => {
    let className = 'border-t py-2'
    if (currentStep !== step) {
      className += ' text-gray-500'
    }
    if (currentStep >= step) {
      className += ' border-black'
    }
    if (currentStep > step) {
      return (
        <Link to={to} className={className}>
          {children}
        </Link>
      )
    }
    return <div className={className}>{children}</div>
  }

  return (
    <div className="min-h-screen bg-red-100">
      <div className="bg-red-100">
        <div className="container pt-16 pb-8">
          <div className="text-2xl">{config.title}</div>
        </div>
      </div>
      <div className="container pt-8 pb-24">
        <Link className="text-sm" to="/cart">
          &laquo; Return to cart
        </Link>
        <div className="text-4xl mt-3 mb-6">Checkout</div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-12">
          <Breadcrumb to="/checkout" step={1}>
            Contact &amp; Shipping Address
          </Breadcrumb>
          <Breadcrumb to="/checkout/shipping" step={2}>
            Shipping Method
          </Breadcrumb>
          <Breadcrumb step={3}>Payment</Breadcrumb>
        </div>

        <div className="flex">
          <div style={{ flex: 3 }}>
            <Switch>
              <Route path="/checkout/shipping" component={Shipping} />
              <Route path="/checkout/payment/:intentId?" component={Payment} />
              <Route path="/checkout" component={Information} />
            </Switch>
          </div>

          <div style={{ flex: 2 }} className="ml-12">
            <div className="text-lg mb-2 font-medium">Order Summary</div>
            <div className="shadow-lg p-4 bg-white text-sm">
              <OrderSummary cart={cart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
