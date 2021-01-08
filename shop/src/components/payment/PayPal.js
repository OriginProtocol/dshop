import React, { useState, useEffect } from 'react'
import fbt, { FbtParam } from 'fbt'
import get from 'lodash/get'

import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import randomstring from 'randomstring'
import { useRouteMatch } from 'react-router-dom'
import useCurrencyOpts from 'utils/useCurrencyOpts'

const PayPal = ({ onChange, loading, encryptedData, submit, disabled }) => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()

  const { post } = useBackendApi({ authToken: true })

  const currencyOpts = useCurrencyOpts()
  const defaultButtonText = (
    <fbt desc="checkout.payment.amount">
      Pay{' '}
      <FbtParam name="amount">{formatPrice(cart.total, currencyOpts)}</FbtParam>
    </fbt>
  )

  const [submitError, setError] = useState(null)

  const paymentMethods = get(config, 'paymentMethods', [])
  const isSelected = get(cart, 'paymentMethod.id') === 'paypal'
  const paypalPaymentMethod = paymentMethods.find((o) => o.id === 'paypal')

  const match = useRouteMatch('/checkout/payment/:intentId?')
  const { intentId } = match.params

  const createOrderAndRedirect = async () => {
    onChange({
      loading: true,
      disabled: true
    })

    const resetState = {
      loading: false,
      disabled: false,
      submit: 0,
      buttonText: defaultButtonText
    }

    setError(null)

    try {
      const randomKey = randomstring.generate()
      const returnUrl = `${window.location.origin}${window.location.pathname}#/checkout/payment/${randomKey}`
      const { authorizeUrl, orderId } = await post('/paypal/pay', {
        body: JSON.stringify({
          amount: (cart.total / 100).toFixed(2),
          data: encryptedData.hash,
          listingId: config.listingId,
          returnUrl,
          cancelUrl: window.location.href,
          clientId: config.paypalClientId,
          currency: config.currency
        })
      })

      window.location = authorizeUrl
      localStorage[`paymentIntent${randomKey}`] = JSON.stringify({
        hash: encryptedData.hash,
        auth: encryptedData.auth,
        orderId,
        clientId: config.paypalClientId
      })

      return
    } catch (err) {
      console.error(err)
      setError(
        fbt(
          'Something went wrong. Please try again later.',
          'checkout.payment.paypal.genericError'
        )
      )
    } finally {
      onChange(resetState)
    }
  }

  const capturePayment = async () => {
    // Capture payment
    onChange({
      loading: true,
      disabled: true,
      buttonText: fbt(
        'Confirming payment...',
        'checkout.payment.paypal.confirming'
      )
    })

    const resetState = {
      loading: false,
      disabled: false,
      submit: 0,
      buttonText: defaultButtonText
    }

    setError(null)

    try {
      const { orderId, clientId, ...encryptedData } = JSON.parse(
        localStorage[`paymentIntent${intentId}`]
      )

      await post('/paypal/capture', {
        body: JSON.stringify({ orderId, clientId })
      })

      delete localStorage[`paymentIntent${intentId}`]
      onChange({ tx: encryptedData.hash, encryptedData })
    } catch (err) {
      console.error(err)
      setError(
        fbt(
          'Something went wrong. Please try again later.',
          'checkout.payment.paypal.genericError'
        )
      )
    } finally {
      onChange(resetState)
    }
  }

  useEffect(() => {
    if (!intentId || !isSelected) return
    capturePayment()
  }, [])

  useEffect(() => {
    if (loading || !submit || !isSelected) return
    createOrderAndRedirect()
  }, [submit, loading, encryptedData, isSelected])

  useEffect(() => {
    if (isSelected && !loading && disabled && !submit) {
      onChange({
        buttonText: defaultButtonText,
        disabled: false
      })
    }
  }, [isSelected, disabled, loading, submit])

  return (
    <>
      <label
        className={`radio align-items-center${isSelected ? '' : ' inactive'}`}
      >
        <input
          type="radio"
          name="paymentMethod"
          checked={isSelected}
          disabled={loading}
          onChange={() => {
            if (loading) {
              return
            }
            onChange({ submit: 0, disabled: false })
            dispatch({
              type: 'updatePaymentMethod',
              method: paypalPaymentMethod
            })
          }}
        />
        PayPal
      </label>
      {!submitError ? (
        !isSelected ? null : (
          <div style={{ margin: '-0.5rem 1rem 1rem 2.25rem' }}>
            <fbt desc="checkout.payment.paypal.redirectionInfo">
              You will be redirected to PayPal to complete payment
            </fbt>
          </div>
        )
      ) : (
        <div className="invalid-feedback px-3 mb-3 d-block">{submitError}</div>
      )}
    </>
  )
}

export default PayPal
