import React, { useState, useEffect } from 'react'

import get from 'lodash/get'

import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
// import { useLocation } from 'react-router-dom'

const PayPal = ({ onChange, loading, encryptedData, submit, disabled }) => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()

  const { post } = useBackendApi({ authToken: true })

  const [submitError, setError] = useState(null)

  const paymentMethods = get(config, 'paymentMethods', [])
  const isSelected = get(cart, 'paymentMethod.id') === 'paypal'
  const paypalPaymentMethod = paymentMethods.find((o) => o.id === 'paypal')

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
      const returnUrl = `${window.location.origin}/#/order/${encryptedData.hash}?auth=${encryptedData.auth}`
      const { authorizeUrl } = await post('/paypal/pay', {
        body: JSON.stringify({
          amount: (cart.total / 100).toFixed(2),
          data: encryptedData.hash,
          listingId: config.listingId,
          returnUrl,
          cancelUrl: window.location.href
        })
      })

      window.location = authorizeUrl

      return
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again later.')
    } finally {
      onChange(resetState)
    }
  }

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
      {!submitError ? null : (
        <div className="invalid-feedback px-3 mb-3 d-block">{submitError}</div>
      )}
    </>
  )
}

export default PayPal

require('react-styl')(`
`)
