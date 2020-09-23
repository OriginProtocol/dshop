import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
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

import { ContactInfo, ShippingAddress } from './_Summary'

const Payment = () => {
  const history = useHistory()
  const { state, setState, onSubmit, disabled } = usePayment()
  const { config } = useConfig()
  const [{ cart }] = useStateValue()

  useEffect(() => {
    if (state.tx) {
      history.push(`/order/${state.tx}?auth=${state.encryptedData.auth}`)
    }
  }, [state.tx])

  const paymentMethods = get(config, 'paymentMethods', [])
  const offlinePaymentMethods = get(config, 'offlinePaymentMethods', []).filter(
    (method) => !method.disabled
  )

  const CryptoCmp = config.useEscrow ? PayWithCrypto : PayWithCryptoDirect

  return (
    <form onSubmit={onSubmit}>
      <ContactInfo cart={cart} />
      <ShippingAddress cart={cart} />

      <div className="text-lg mb-2 font-medium">3. Shipping method</div>
      <div className="shadow-lg p-4 bg-white grid gap-y-2 mb-8">
        {get(cart, 'userInfo.zip')}, {get(cart, 'userInfo.country')}
      </div>
      <div className="mb-2 flex justify-between items-center">
        <div className="text-lg font-medium">4. Payment</div>
        <div className="text-gray-500">
          All transactions are secure and encrypted
        </div>
      </div>
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
