import React, { useState, useEffect } from 'react'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'

const NoPaymentDue = ({ onChange, encryptedData, submit }) => {
  const [submitError, setSubmitError] = useState()
  const { post } = useBackendApi({ authToken: true })
  const defaultButtonText = <fbt desc="Submit">Submit</fbt>

  useEffect(() => {
    if (!submit) {
      return
    }

    const resetState = {
      loading: false,
      disabled: false,
      buttonText: defaultButtonText,
      submit: 0
    }

    onChange({ loading: true })

    post('/pay', {
      body: JSON.stringify({
        data: encryptedData.hash,
        amount: 0
      })
    })
      .then((result) => {
        if (result.error) {
          setSubmitError(result.error.message)
          onChange(resetState)
        } else {
          onChange({ tx: encryptedData.hash, loading: false })
        }
      })
      .catch((err) => {
        console.log(err)
        setSubmitError('Payment server error. Please try again later.')
        onChange(resetState)
      })
  }, [submit])

  return (
    <>
      <label>
        <fbt desc="checkout.payment.noPaymentDue">No payment is due</fbt>
      </label>
      {!submitError ? null : (
        <div className="invalid-feedback px-3 mb-3 d-block">{submitError}</div>
      )}
    </>
  )
}

export default NoPaymentDue

require('react-styl')(`
`)
