import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import usePayment from 'utils/usePayment'

import Link from 'components/Link'

import PayWithCrypto from 'pages/checkout/payment-methods/crypto/Crypto'
import PayWithCryptoDirect from 'pages/checkout/payment-methods/crypto/CryptoDirect'
import PayWithStripe from 'pages/checkout/payment-methods/Stripe'
import PayWithUphold from 'pages/checkout/payment-methods/uphold/Uphold'
import PayOffline from 'pages/checkout/payment-methods/OfflinePayment'
import PayWithPayPal from 'pages/checkout/payment-methods/PayPal'
import NoPaymentDue from 'pages/checkout/payment-methods/NoPaymentDue'

const Payment = () => {
  const { state, setState, onSubmit, disabled } = usePayment()
  const { config } = useConfig()
  const [{ cart }] = useStateValue()

  const paymentMethods = get(config, 'paymentMethods', [])
  const offlinePaymentMethods = get(config, 'offlinePaymentMethods', []).filter(
    (method) => !method.disabled
  )

  const CryptoCmp = config.useEscrow ? PayWithCrypto : PayWithCryptoDirect

  return (
    <form style={{ flex: 3 }} onSubmit={onSubmit}>
      <div className="text-lg mb-2">1. Contact information</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2 mb-8 text-sm">
        <div className="font-semibold">Email</div>
        <div>{get(cart, 'userInfo.email')}</div>
      </div>
      <div className="text-lg mb-2">2. Shipping address</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2 mb-8 text-sm">
        <div className="font-semibold">
          {get(cart, 'userInfo.firstName')} {get(cart, 'userInfo.lastName')}
        </div>
        <div>
          {get(cart, 'userInfo.address1')}, {get(cart, 'userInfo.city')}
          {', '}
          {get(cart, 'userInfo.zip')}, {get(cart, 'userInfo.country')}
        </div>
      </div>
      <div className="text-lg mb-2">3. Shipping method</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2 mb-8">
        {get(cart, 'userInfo.zip')}, {get(cart, 'userInfo.country')}
      </div>
      <div className="text-lg mb-2">4. Shipping method</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2">
        {cart.total === 0 ? (
          <NoPaymentDue {...state} onChange={setState} />
        ) : (
          <>
            {!paymentMethods.find((p) => p.id === 'crypto') ? null : (
              <CryptoCmp {...state} onChange={setState} />
            )}
            {!paymentMethods.find((p) => p.id === 'stripe') ? null : (
              <PayWithStripe {...state} onChange={setState} />
            )}
            {!paymentMethods.find((p) => p.id === 'uphold') ? null : (
              <PayWithUphold {...state} onChange={setState} />
            )}
            {!paymentMethods.find((p) => p.id === 'paypal') ? null : (
              <PayWithPayPal {...state} onChange={setState} />
            )}
            {offlinePaymentMethods.map((method) => (
              <PayOffline
                {...state}
                onChange={setState}
                key={method.id}
                paymentMethod={method}
              />
            ))}
          </>
        )}
      </div>
      <div className="flex justify-between mt-12 items-center">
        <Link className="text-lg" to="/checkout">
          &laquo; Back
        </Link>
        <button
          type="submit"
          className={`btn btn-primary ${disabled ? ' opacity-50' : ''}`}
          children={state.buttonText}
        />
      </div>
    </form>
  )
}

export default Payment
