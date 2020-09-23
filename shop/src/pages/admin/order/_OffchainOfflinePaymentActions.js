import React, { useReducer } from 'react'
import get from 'lodash/get'

import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import PaymentStates from 'data/PaymentStates'
import { useRouteMatch } from 'react-router-dom'

const reducer = (state, newState) => ({ ...state, ...newState })

const OffchainOfflinePaymentActions = ({ order }) => {
  const match = useRouteMatch('/admin/orders/:orderId/:tab?')
  const { orderId } = match.params

  const [, dispatch] = useStateValue()

  const paymentCode = get(order, 'paymentCode', '')

  const [state, setState] = useReducer(reducer, {})

  const { post } = useBackendApi({ authToken: true })

  const paymentState = get(order, 'paymentStatus')

  const updateState = async (newState) => {
    try {
      await post('/offline-payments/payment-state', {
        method: 'PUT',
        body: JSON.stringify({
          paymentCode,
          state: newState
        })
      })

      dispatch({
        type: 'toast',
        style: 'success',
        message: fbt(
          'Payment state updated!',
          'admin.order.paymentStateUpdated'
        )
      })
      dispatch({ type: 'reload', target: `order-${orderId}` })
    } catch (err) {
      dispatch({
        type: 'toast',
        style: 'error',
        message: fbt(
          'Failed to update payment state. Try again later.',
          'admin.order.paymentStateUpdateFailed'
        )
      })
      console.error('Failed to change payment state', err)
    } finally {
      setState({
        marking: false,
        refunding: false
      })
    }
  }

  const markAsPaid = () => {
    if (state.marking || state.refunding) return
    setState({
      marking: true
    })

    updateState(PaymentStates.Paid)
  }

  const markAsRefunded = () => {
    if (state.marking || state.refunding) return
    setState({
      refunding: true
    })

    updateState(PaymentStates.Refunded)
  }

  return (
    <div
      className="payment-status-actions"
      onClick={(e) => e.stopPropagation()}
    >
      {paymentState !== PaymentStates.Pending ? null : (
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={markAsPaid}
          children={fbt('Mark as Paid', 'admin.order.markPaid')}
        />
      )}

      {paymentState === PaymentStates.Refunded ? null : (
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={markAsRefunded}
          children={fbt('Refund', 'Refund')}
          disabled={state.loading || state.refunding}
        />
      )}
    </div>
  )
}

export default OffchainOfflinePaymentActions

require('react-styl')(`
`)
