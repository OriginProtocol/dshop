import React, { useEffect, useReducer } from 'react'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import addData from 'data/addData'
import formatPrice from 'utils/formatPrice'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import useCurrencyOpts from 'utils/useCurrencyOpts'

const reducer = (state, newState) => ({ ...state, ...newState })

function usePayment() {
  const { config } = useConfig()
  const [{ cart, referrer }, dispatch] = useStateValue()
  const currencyOpts = useCurrencyOpts()

  const defaultButtonText = (
    <fbt desc="checkout.payment.amount">
      Pay{' '}
      <FbtParam name="amount">{formatPrice(cart.total, currencyOpts)}</FbtParam>
    </fbt>
  )
  const [state, setState] = useReducer(reducer, {
    buttonText: defaultButtonText,
    submit: 0
  })

  const paymentMethod = get(cart, 'paymentMethod.id')
  const paymentMethods = get(config, 'paymentMethods', [])

  useEffect(() => {
    if (paymentMethods.length === 1) {
      dispatch({ type: 'updatePaymentMethod', method: paymentMethods[0] })
    }
  }, [paymentMethods.length])

  const isOfflinePayment = !!get(cart, 'paymentMethod.instructions', false)

  useEffect(() => {
    if (state.loading) return
    if (isOfflinePayment) {
      setState({
        buttonText: isOfflinePayment ? (
          <fbt desc="checkout.payment.placeOrder">Place Order</fbt>
        ) : (
          defaultButtonText
        )
      })
    }
  }, [isOfflinePayment, state.loading])

  const disabled = state.disabled || !paymentMethod

  function onSubmit(e) {
    e.preventDefault()
    if (disabled) {
      return
    }

    setState({
      disabled: true,
      loading: true,
      buttonText: fbt('Processing...', 'Processing...')
    })

    addData({ ...cart, referrer }, config).then((encryptedData) => {
      setState({
        loading: false,
        encryptedData,
        submit: state.submit + 1
      })
    })
  }

  return { state, setState, onSubmit, disabled }
}

export default usePayment
