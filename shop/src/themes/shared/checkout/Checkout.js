import React from 'react'
import { Switch, Route, useRouteMatch } from 'react-router-dom'
import { StripeProvider, Elements } from 'react-stripe-elements'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import usePGP from 'utils/usePGP'
import useStripe from 'utils/useStripe'
import useIsMobile from 'utils/useIsMobile'

import Link from 'components/Link'

import { Information, MobileInformation } from './Information'
import { MobileShippingAddress, MobileShipping, Shipping } from './Shipping'
import { Payment, MobilePayment } from './Payment'

import { OrderSummary } from './_Summary'

import './checkout.css'

const Checkout = () => {
  const { config } = useConfig()
  const stripe = useStripe()
  usePGP()
  let currentStep = 1
  if (useRouteMatch('/checkout/shipping')) currentStep = 2
  if (useRouteMatch('/checkout/payment')) currentStep = 3

  const isMobile = useIsMobile()
  const props = { currentStep, config }
  const cmp = isMobile ? <Mobile {...props} /> : <Desktop {...props} />
  return (
    <StripeProvider stripe={stripe}>
      <Elements>{cmp}</Elements>
    </StripeProvider>
  )
}

const Mobile = ({ config }) => {
  const [{ cart }] = useStateValue()
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
      <div className="pt-10 pb-6 px-8">
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
      <div className="shadow-lg p-8 bg-white dark:bg-gray-900 mt-4">
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
      className += ' dark:border-white border-black hover:opacity-75'
    } else {
      className += ' dark:border-gray-500'
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
    <div className="min-h-screen dark:bg-black dark:text-white bg-gray-100">
      <div className="bg-white dark:bg-gray-900">
        <div className="container pt-16 pb-8">
          <div className="text-2xl">{config.title}</div>
        </div>
      </div>
      <div className="border-t dark:border-gray-700" />
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
            <div className="shadow-lg p-4 dark:bg-gray-900 bg-white text-sm">
              <OrderSummary cart={cart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
