import React, { useReducer } from 'react'
import get from 'lodash/get'

import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import PaymentStates from 'data/PaymentStates'
import PaymentTypes from 'data/PaymentTypes'
import { useRouteMatch } from 'react-router-dom'

const reducer = (state, newState) => ({ ...state, ...newState })

const OffchainPaymentActions = ({ order }) => {
  const match = useRouteMatch('/admin/orders/:orderId/:tab?')
  const { orderId } = match.params

  const [, dispatch] = useStateValue()

  const paymentCode = get(order, 'paymentCode', '')

  const [state, setState] = useReducer(reducer, {})

  const { post } = useBackendApi({ authToken: true })

  const paymentState = get(order, 'paymentStatus')
  const paymentType = get(order, 'paymentType')

  const updateState = async (newState) => {
    try {
      const { success, reason } = await post(
        `/orders/${orderId}/payment-state`,
        {
          method: 'PUT',
          body: JSON.stringify({
            paymentCode,
            state: newState
          }),
          suppressError: true
        }
      )

      dispatch({
        type: 'toast',
        style: success ? 'success' : 'error',
        message: success
          ? fbt('Payment state updated!', 'admin.order.paymentStateUpdated')
          : reason
      })

      if (success) {
        dispatch({ type: 'reload', target: `order-${orderId}` })
      }
    } catch (err) {
      dispatch({
        type: 'toast',
        style: 'error',
        message:
          err.message ||
          fbt(
            'Failed to update payment state. Try again later.',
            'admin.order.paymentStateUpdateFailed'
          )
      })
      console.error('Failed to change payment state', err)
    } finally {
      setState({
        marking: false,
        refunding: false,
        rejecting: false
      })
    }
  }

  const markAsPaid = () => {
    if (state.marking || state.refunding || state.rejecting) return
    setState({
      marking: true
    })

    updateState(PaymentStates.Paid)
  }

  const markAsRejected = () => {
    if (state.marking || state.refunding || state.rejecting) return
    setState({
      rejecting: true
    })

    updateState(PaymentStates.Rejected)
  }

  const markAsRefunded = () => {
    if (state.marking || state.refunding || state.rejecting) return
    setState({
      refunding: true
    })

    updateState(PaymentStates.Refunded)
  }

  const markPaidButton =
    paymentType !== PaymentTypes.Offline ? null : (
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={markAsPaid}
        children={
          state.marking
            ? `${fbt('Marking', 'Marking')}...`
            : fbt('Mark as Paid', 'admin.order.markPaid')
        }
        disabled={state.marking || state.refunding || state.rejecting}
      />
    )

  const refundButton = (
    <button
      type="button"
      className="btn btn-outline-danger"
      onClick={markAsRefunded}
      children={
        state.refunding
          ? `${fbt('Refunding', 'Refunding')}...`
          : fbt('Refund', 'Refund')
      }
      disabled={state.marking || state.refunding || state.rejecting}
    />
  )

  const rejectButton = (
    <button
      type="button"
      className="btn btn-outline-danger"
      onClick={markAsRejected}
      children={
        state.refunding
          ? `${fbt('Rejecting', 'Rejecting')}...`
          : fbt('Reject', 'Reject')
      }
      disabled={state.marking || state.refunding || state.rejecting}
    />
  )

  return (
    <div
      className="payment-status-actions"
      onClick={(e) => e.stopPropagation()}
    >
      {paymentState === PaymentStates.Pending ? (
        <>
          {markPaidButton}
          {rejectButton}
        </>
      ) : paymentState === PaymentStates.Paid ? (
        refundButton
      ) : null}
    </div>
  )
}

export default OffchainPaymentActions

require('react-styl')(`
`)
