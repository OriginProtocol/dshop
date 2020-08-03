import React, { useState, useEffect, useReducer } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

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
import PayWithPayPal from './payment-methods/PayPal'
import BillingAddress from './_BillingAddress'

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
    newState.billingFirstNameError = 'Enter a first name'
  }
  if (!state.billingLastName) {
    newState.billingLastNameError = 'Enter a last name'
  }
  if (!state.billingAddress1) {
    newState.billingAddress1Error = 'Enter an address'
  }
  if (!state.billingCity) {
    newState.billingCityError = 'Enter a city'
  }
  if (!state.billingZip) {
    newState.billingZipError = 'Enter a ZIP / postal code'
  }
  const provinces = get(Countries, `${state.billingCountry}.provinces`, {})
  if (!state.billingProvince && Object.keys(provinces).length) {
    newState.billingProvinceError = 'Enter a state / province'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const reducer = (state, newState) => ({ ...state, ...newState })

const ChoosePayment = () => {
  const history = useHistory()
  const { config } = useConfig()
  const [{ cart, referrer }, dispatch] = useStateValue()
  const [paymentState, setPaymentState] = useReducer(reducer, {
    buttonText: `Pay ${formatPrice(cart.total, { currency: config.currency })}`,
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

  useEffect(() => {
    if (paymentMethods.length === 1) {
      dispatch({ type: 'updatePaymentMethod', method: paymentMethods[0] })
    }
  }, [paymentMethods.length])

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
      buttonText: 'Processing...'
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
      </div>

      {hideBillingAddress ? null : (
        <BillingAddress {...{ formState, setFormState, input, Feedback }} />
      )}

      <div className="actions">
        <Link to="/checkout/shipping">&laquo; Return to shipping</Link>
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
