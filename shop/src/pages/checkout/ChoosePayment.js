import React, { useState, useEffect, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import addData from 'data/addData'
import { formInput, formFeedback } from 'utils/formHelpers'
import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import fetchProductStock from 'data/fetchProductStock'
import { Countries } from '@origin/utils/Countries'

import Link from 'components/Link'

import PayWithCrypto from 'components/payment/crypto/Crypto'
import PayWithCryptoDirect from 'components/payment/crypto/CryptoDirect'
import PayWithStripe from 'components/payment/Stripe'
import PayWithUphold from 'components/payment/uphold/Uphold'
import PayOffline from 'components/payment/OfflinePayment'
import PayWithPayPal from 'components/payment/PayPal'
import NoPaymentDue from 'components/payment/NoPaymentDue'
import BillingAddress from './_BillingAddress'
import useCurrencyOpts from 'utils/useCurrencyOpts'

function validate(state) {
  if (!state.billingDifferent) {
    Object.keys(state).forEach((k) => {
      if (k.indexOf('Error') > 0) {
        delete state[k]
      }
    })
    return { valid: true, newState: state }
  }

  const newState = {}

  if (!state.billingFirstName) {
    newState.billingFirstNameError = fbt(
      'Enter a first name',
      'checkout.payment.billingFirstNameError'
    )
  }
  if (!state.billingLastName) {
    newState.billingLastNameError = fbt(
      'Enter a last name',
      'checkout.payment.billingLastNameError'
    )
  }
  if (!state.billingAddress1) {
    newState.billingAddress1Error = fbt(
      'Enter an address',
      'checkout.payment.billingAddress1Error'
    )
  }
  if (!state.billingCity) {
    newState.billingCityError = fbt(
      'Enter a city',
      'checkout.payment.billingCityError'
    )
  }
  if (!state.billingZip) {
    newState.billingZipError = fbt(
      'Enter a ZIP / postal code',
      'checkout.payment.billingZipError'
    )
  }
  const provinces = get(Countries, `${state.billingCountry}.provinces`, {})
  if (!state.billingProvince && Object.keys(provinces).length) {
    newState.billingProvinceError = fbt(
      'Enter a state / province',
      'checkout.payment.billingProvinceError'
    )
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const reducer = (state, newState) => ({ ...state, ...newState })

const ChoosePayment = () => {
  const history = useHistory()
  const { config } = useConfig()
  const [{ cart, referrer }, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  const itemsOutOfStock = cart.items.some((i) => i.outOfStock)

  const defaultButtonText = (
    <fbt desc="checkout.payment.amount">
      Pay{' '}
      <FbtParam name="amount">{formatPrice(cart.total, currencyOpts)}</FbtParam>
    </fbt>
  )
  const [paymentState, setPaymentState] = useReducer(reducer, {
    buttonText: defaultButtonText,
    submit: 0
  })

  useEffect(() => {
    const { tx, encryptedData } = paymentState
    if (tx) {
      history.push(`/order/${tx}?auth=${encryptedData.auth}`)
    }
  }, [paymentState])

  const paymentMethod = get(cart, 'paymentMethod.id')
  const [formState, setFormStateRaw] = useState({
    ...cart.userInfo,
    billingCountry: get(cart, 'userInfo.billingCountry') || 'United States'
  })
  const setFormState = (s) => setFormStateRaw({ ...formState, ...s })
  const input = formInput(formState, (newState) => setFormState(newState))

  const paymentMethods = get(config, 'paymentMethods', [])
  const offlinePaymentMethods = get(config, 'offlinePaymentMethods', []).filter(
    (method) => !method.disabled
  )

  useEffect(() => {
    const shouldSelectFirstOptions =
      paymentMethods.length >= 1 && paymentMethod === undefined
    if (shouldSelectFirstOptions) {
      dispatch({ type: 'updatePaymentMethod', method: paymentMethods[0] })
    }
  }, [paymentMethods.length, paymentMethod])

  const isOfflinePayment = !!get(cart, 'paymentMethod.instructions', false)

  useEffect(() => {
    if (paymentState.loading) return
    if (isOfflinePayment) {
      setPaymentState({
        buttonText: isOfflinePayment ? (
          <fbt desc="checkout.payment.placeOrder">Place Order</fbt>
        ) : (
          defaultButtonText
        )
      })
    }
  }, [isOfflinePayment, paymentState.loading])

  const Feedback = formFeedback(formState)

  const disabled = paymentState.disabled || !paymentMethod || itemsOutOfStock
  const hideBillingAddress = paymentMethod !== 'stripe'

  function onSubmit(e) {
    e.preventDefault()
    if (disabled) {
      return
    }

    const { valid, newState } = validate(formState)
    setFormState(newState)
    if (!valid) {
      return
    }

    dispatch({ type: 'updateUserInfo', info: newState })
    setPaymentState({
      disabled: true,
      loading: true,
      buttonText: fbt('Processing...', 'Processing...')
    })
    addData({ ...cart, referrer }, config).then(async (encryptedData) => {
      if (config.inventory) {
        const { products: stockData } = await fetchProductStock(null, config)
        let outOfStockItems = false
        cart.items.forEach((item) => {
          const stockItem = stockData.find((s) => s.productId === item.product)
          if (!stockItem) return
          const variantStock = get(stockItem, `variantsStock[${item.variant}]`)
          if (typeof variantStock === 'number' && variantStock > 0) return
          const productStock = get(stockItem, `stockLeft`)
          if (typeof productStock === 'number' && variantStock > 0) return
          if (variantStock === 0 || productStock === 0) {
            outOfStockItems = true
            dispatch({ type: 'setCartOutOfStock', item })
          }
        })
        if (outOfStockItems) {
          setPaymentState({
            disabled: false,
            loading: false,
            buttonText: defaultButtonText
          })
          return
        }
      }
      setPaymentState({
        loading: false,
        encryptedData,
        submit: paymentState.submit + 1
      })
    })
  }

  const CryptoCmp = config.useEscrow ? PayWithCrypto : PayWithCryptoDirect

  return (
    <form onSubmit={onSubmit}>
      {itemsOutOfStock ? (
        <div className="checkout-payment-method">
          <div className="text-danger p-3">
            Sorry, some items in your cart are out of stock.
          </div>
        </div>
      ) : cart.total === 0 ? (
        <div className="checkout-payment-method">
          <NoPaymentDue {...paymentState} onChange={setPaymentState} />
        </div>
      ) : (
        <>
          <div className="checkout-payment-method">
            {!paymentMethods.find((p) => p.id === 'crypto') ? null : (
              <CryptoCmp {...paymentState} onChange={setPaymentState} />
            )}
            {!paymentMethods.find((p) => p.id === 'stripe') ? null : (
              <PayWithStripe {...paymentState} onChange={setPaymentState} />
            )}
            {!paymentMethods.find((p) => p.id === 'uphold') ? null : (
              <PayWithUphold {...paymentState} onChange={setPaymentState} />
            )}
            {!paymentMethods.find((p) => p.id === 'paypal') ? null : (
              <PayWithPayPal {...paymentState} onChange={setPaymentState} />
            )}
            {offlinePaymentMethods.map((method) => (
              <PayOffline
                {...paymentState}
                onChange={setPaymentState}
                key={method.id}
                paymentMethod={method}
              />
            ))}
          </div>

          {hideBillingAddress ? null : (
            <BillingAddress {...{ formState, setFormState, input, Feedback }} />
          )}
        </>
      )}

      <div className="actions">
        <Link to="/checkout/shipping">
          &laquo; <fbt desc="checkout.payment.goback">Return to shipping</fbt>
        </Link>
        <button
          type="submit"
          className={`btn btn-primary btn-lg${disabled ? ' disabled' : ''}`}
          children={paymentState.buttonText}
        />
      </div>
    </form>
  )
}

export default ChoosePayment

require('react-styl')(`
  .checkout-payment-method
    border: 1px solid #eee
    border-radius: 0.5rem
    label
      margin-bottom: 0
      padding: 1rem
    label .description
      font-size: 0.875rem
      color: #666
    label.inactive
      cursor: pointer
      &:hover
        color: #666
    label:not(:first-child)
      border-top: 1px solid #eee
      padding-top: 1rem
    .radio
      display: flex
      align-items: baseline
      input
        margin-right: 0.5rem
        margin-bottom: 3px
        transform: scale(1.25)
      .cards
        margin-left: auto
        display: flex
        font-size: 12px
        color: #737373
        align-items: center
        > div
          width: 38px
          height: 24px
          margin-right: 4px
          &.visa
            background: url(images/visa.svg)
          &.master
            background: url(images/master.svg)
          &.amex
            background: url(images/amex.svg)
          &.discover
            background: url(images/discover.svg)
          &:last-child
            margin-right: 8px

`)
