import React from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import PayWithCrypto from 'components/payment/crypto/Crypto'
import PayWithCryptoDirect from 'components/payment/crypto/CryptoDirect'
import PayWithStripe from 'components/payment/Stripe'
import PayWithUphold from 'components/payment/uphold/Uphold'
import PayOffline from 'components/payment/OfflinePayment'
import PayWithPayPal from 'components/payment/PayPal'
import NoPaymentDue from 'components/payment/NoPaymentDue'

const PaymentChooser = ({ state, setState }) => {
  const { config } = useConfig()
  const [{ cart }] = useStateValue()

  const paymentMethods = get(config, 'paymentMethods', [])
  const offlinePaymentMethods = get(config, 'offlinePaymentMethods', []).filter(
    (method) => !method.disabled
  )

  const CryptoCmp = config.useEscrow ? PayWithCrypto : PayWithCryptoDirect

  if (cart.total === 0) return <NoPaymentDue {...state} onChange={setState} />

  return (
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
  )
}

export default PaymentChooser
