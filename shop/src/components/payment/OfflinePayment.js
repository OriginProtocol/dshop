import React, { useEffect, useState } from 'react'
import get from 'lodash/get'
import fbt from 'fbt'
import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

import PaymentInstructions from 'components/OfflinePaymentInstructions'

const OfflinePayment = ({
  onChange,
  encryptedData,
  submit,
  loading,
  disabled,
  paymentMethod
}) => {
  const [{ cart }, dispatch] = useStateValue()
  const [submitError, setError] = useState()

  const selectedMethodId = get(cart, 'paymentMethod.id')

  const methodId = paymentMethod ? paymentMethod.id : ''
  const isSelected = methodId === selectedMethodId
  const inactive = isSelected ? '' : ' inactive'

  const { post } = useBackendApi({ authToken: true })

  useEffect(() => {
    if (isSelected && !loading && disabled && !submit) {
      onChange({
        disabled: false
      })
    }
  }, [isSelected, disabled, loading, submit])

  const dataHash = get(encryptedData, 'hash')

  const placeOrder = async () => {
    onChange({
      disabled: true,
      loading: true
    })

    setError(null)

    try {
      const data = await post('/offline-payments/order', {
        body: JSON.stringify({
          encryptedData: dataHash,
          methodId
        }),
        method: 'POST',
        suppressError: true
      })

      if (data.success === true) {
        onChange({
          tx: dataHash,
          submit: 0,
          loading: false,
          disabled: false
        })
      } else {
        setError(data.message)
        onChange({
          loading: false,
          submit: 0,
          disabled: false
        })
      }
    } catch (err) {
      console.error(err)
      setError(
        fbt(
          'Payment server error. Please try again later.',
          'checkout.payment.serverError'
        )
      )
      onChange({
        loading: false,
        submit: 0,
        disabled: false
      })
    }
  }

  useEffect(() => {
    if (!isSelected || !submit || !dataHash || loading) return

    placeOrder()
  }, [isSelected, submit, dataHash, loading])

  if (!paymentMethod) {
    return null
  }

  return (
    <>
      <label className={`radio  align-items-center${inactive}`}>
        <input
          type="radio"
          name="paymentMethod"
          checked={selectedMethodId === methodId}
          onChange={() => {
            dispatch({
              type: 'updatePaymentMethod',
              method: paymentMethod
            })
          }}
        />
        {paymentMethod.label}
      </label>
      {!submitError ? null : (
        <div className="invalid-feedback px-3 mb-3 d-block">{submitError}</div>
      )}
      {!isSelected ? null : (
        <div className="offline-payment-details">
          {paymentMethod.details}
          <PaymentInstructions paymentMethod={paymentMethod} />
        </div>
      )}
    </>
  )
}

export default OfflinePayment

require('react-styl')(`
  .offline-payment-details
    margin: 0 2.25rem 1rem 2.25rem
`)
