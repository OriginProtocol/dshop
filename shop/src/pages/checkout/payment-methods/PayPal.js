import React, { useState, useEffect } from 'react'

import get from 'lodash/get'

import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import randomstring from 'randomstring'
import { useRouteMatch } from 'react-router-dom'
// import { useLocation } from 'react-router-dom'

const PayPal = ({ onChange, loading, encryptedData, submit, disabled }) => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()

  const { post } = useBackendApi({ authToken: true })

  const [submitError, setError] = useState(null)

  const paymentMethods = get(config, 'paymentMethods', [])
  const isSelected = get(cart, 'paymentMethod.id') === 'paypal'
  const paypalPaymentMethod = paymentMethods.find((o) => o.id === 'paypal')

  const match = useRouteMatch('/checkout/payment/:intentId?')
  const { intentId } = match.params

  // const location = useLocation()

  const createOrderAndRedirect = async () => {
    onChange({
      loading: true,
      disabled: true
    })

    const resetState = {
      loading: false,
      disabled: false,
      submit: 0,
      buttonText: `Pay ${formatPrice(cart.total)}`
    }

    setError(null)

    try {
      // const returnUrl = `${window.location.origin}/#/order/${encryptedData.hash}?auth=${encryptedData.auth}`
      const randomKey = randomstring.generate()
      const returnUrl = `${window.location.origin}/#/checkout/payment/${randomKey}`
      const { authorizeUrl, orderId } = await post('/paypal/pay', {
        body: JSON.stringify({
          amount: (cart.total / 100).toFixed(2),
          data: encryptedData.hash,
          listingId: config.listingId,
          returnUrl,
          cancelUrl: window.location.href,
          clientId: config.paypalClientId
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
      setError('Something went wrong. Please try again later.')
    } finally {
      onChange(resetState)
    }
  }

  const capturePayment = async () => {
    // Capture payment
    onChange({
      loading: true,
      disabled: true,
      buttonText: 'Confirming payment...'
    })

    const resetState = {
      loading: false,
      disabled: false,
      submit: 0,
      buttonText: `Pay ${formatPrice(cart.total)}`
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
      setError('Something went wrong. Please try again later.')
    } finally {
      onChange(resetState)
    }
  }

  useEffect(() => {
    if (!intentId) return
    capturePayment()
  }, [])

  useEffect(() => {
    if (loading || !submit) return
    createOrderAndRedirect()
  }, [submit, loading, encryptedData])

  useEffect(() => {
    if (isSelected && !loading && disabled && !submit) {
      onChange({
        buttonText: `Pay ${formatPrice(cart.total)}`,
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
            You will be redirected to PayPal to complete payment
          </div>
        )
      ) : (
        <div className="invalid-feedback px-3 mb-3 d-block">{submitError}</div>
      )}
    </>
  )
}

export default PayPal

require('react-styl')(`
`)
