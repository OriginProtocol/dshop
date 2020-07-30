import React, { useEffect } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

import PaymentInstructions from 'components/OfflinePaymentInstructions'

const OfflinePayment = ({
  onChange,
  encryptedData,
  submit,
  loading,
  paymentMethod
}) => {
  const [{ cart }, dispatch] = useStateValue()

  const selectedMethodId = get(cart, 'paymentMethod.id')

  const methodId = paymentMethod ? paymentMethod.id : ''
  const isSelected = methodId === selectedMethodId
  const inactive = isSelected ? '' : ' inactive'

  const { post } = useBackendApi({ authToken: true })

  useEffect(() => {
    if (isSelected) {
      onChange({
        disabled: false
      })
    }
  }, [isSelected])

  const dataHash = get(encryptedData, 'hash')

  const placeOrder = async () => {
    onChange({
      disabled: true,
      loading: true
    })

    try {
      const data = await post('/offline-payments/order', {
        body: JSON.stringify({
          encryptedData: dataHash
        }),
        method: 'POST',
        suppressError: true,
        rawData: true
      })

      if (data === 'OK') {
        onChange({
          tx: dataHash,
          submit: 0,
          loading: false,
          disabled: false
        })
      } else {
        throw new Error(JSON.parse(data).message)
      }
    } catch (err) {
      console.error(err)
      // dispatch({
      //   type: 'toast',
      //   message: 'Failed to place order. Contact support.',
      //   style: 'error'
      // })
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
