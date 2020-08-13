import React, { useState, useEffect, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import { fbt, FbtParam } from 'fbt-runtime'
import addData from 'data/addData'
import { formInput, formFeedback } from 'utils/formHelpers'
import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import { Countries } from '@origin/utils/Countries'

import Link from 'components/Link'

import PayWithCrypto from './payment-methods/Crypto'
import PayWithStripe from './payment-methods/Stripe'
import PayWithUphold from './payment-methods/Uphold'
import PayOffline from './payment-methods/OfflinePayment'
import PayWithPayPal from './payment-methods/PayPal'
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
    if (paymentMethods.length === 1) {
      dispatch({ type: 'updatePaymentMethod', method: paymentMethods[0] })
    }
  }, [paymentMethods.length])

  const isOfflinePayment = !!get(cart, 'paymentMethod.instructions', false)

  useEffect(() => {
    if (paymentState.loading) return
    setPaymentState({
      buttonText: isOfflinePayment ? (
        <fbt desc="checkout.payment.placeOrder">Place Order</fbt>
      ) : (
        defaultButtonText
      )
    })
  }, [isOfflinePayment, paymentState.loading])

  const Feedback = formFeedback(formState)

  const disabled = paymentState.disabled || !paymentMethod
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
    addData({ ...cart, referrer }, config).then((encryptedData) => {
      setPaymentState({
        loading: false,
        encryptedData,
        submit: paymentState.submit + 1
      })
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="checkout-payment-method">
        {!paymentMethods.find((p) => p.id === 'crypto') ? null : (
          <PayWithCrypto {...paymentState} onChange={setPaymentState} />
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
