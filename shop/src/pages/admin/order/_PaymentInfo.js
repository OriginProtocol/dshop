import React, { useReducer } from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import useOfferData from 'utils/useOfferData'
import useAcceptOffer from 'utils/useAcceptOffer'
import useFinalizeOffer from 'utils/useFinalizeOffer'
import useWithdrawOffer from 'utils/useWithdrawOffer'

const reducer = (state, newState) => ({ ...state, ...newState })

const OfferStates = {
  Created: 'OfferCreated',
  Accepted: 'OfferAccepted',
  Finalized: 'OfferFinalized',
  Withdrawn: 'OfferWithdrawn',
  Disputed: 'OfferDisputed'
}

const getStatusText = (orderState, paymentMethod) => {
  const isCryptoPayment = paymentMethod.id === 'crypto'

  switch (orderState) {
    case OfferStates.Created:
      return isCryptoPayment
        ? `A crypto payment has been made. Make sure you have some ETH to cover gas costs.`
        : `A payment has been made with ${paymentMethod.label}.`

    case OfferStates.Accepted:
      return `The offer made with ${paymentMethod.label} has been accepted. Finalize offer to process the payment.`
    case OfferStates.Finalized:
      return `Payment made with ${paymentMethod.label} has been accepted and Finalized.`
    case OfferStates.Withdrawn:
      return `The offer made with ${paymentMethod.label} has been rejected and refunded.`
  }
}

const getButtonText = (orderState) => {
  switch (orderState) {
    case OfferStates.Created:
      return 'Accept Payment'

    case OfferStates.Accepted:
      return 'Finalize Purchase'
  }
}

const PaymentInfo = ({ order }) => {
  const [state, setState] = useReducer(reducer, {
    submit: 0,
    submitWithdraw: 0,
    rejectButtonText: 'Reject & Refund'
  })

  const match = useRouteMatch('/admin/orders/:orderId')
  const { orderId } = match.params

  const cart = get(order, 'data')
  const paymentMethod = get(cart, 'paymentMethod', {})
  const orderState = get(order, 'statusStr')

  const { sellerProxy } = useOfferData(orderId)

  useAcceptOffer({
    offerId: orderId,
    onChange: setState,
    sellerProxy,
    submit: orderState === OfferStates.Created ? state.submit : 0,
    buttonText: 'Accept Payment'
  })

  useFinalizeOffer({
    offerId: orderId,
    onChange: setState,
    sellerProxy,
    submit: orderState === OfferStates.Accepted ? state.submit : 0,
    buttonText: 'Finalize Purchase'
  })

  useWithdrawOffer({
    offerId: orderId,
    onChange: ({ buttonText, ...props }) =>
      setState({ rejectButtonText: buttonText, ...props }),
    sellerProxy,
    submit: state.submitWithdraw,
    buttonText: state.rejectButtonText
  })

  if (!cart) return <div>Loading...</div>

  const completed = orderState === OfferStates.Finalized

  const hasActions = [OfferStates.Created, OfferStates.Accepted].includes(
    orderState
  )

  const canWithdraw = orderState === OfferStates.Created

  return (
    <div className={`order-payment-info${completed ? ' completed' : ''}`}>
      <div className="status-text">
        {getStatusText(orderState, paymentMethod)}
      </div>
      {!hasActions ? null : (
        <div className="status-actions">
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={() => setState({ submit: state.submit + 1 })}
            children={state.buttonText || getButtonText(orderState)}
            disabled={state.disabled}
          />
          {!canWithdraw ? null : (
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={() =>
                setState({ submitWithdraw: state.submitWithdraw + 1 })
              }
              children={state.rejectButtonText}
              disabled={state.disabled}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default PaymentInfo

require('react-styl')(`
  .order-payment-info
    border-radius: 10px
    border: solid 1px #ffd400
    background-color: #fffcf0
    padding: 1rem
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center
    text-align: center
    &.completed
      background-color: #f0fffc
      border: solid 1px #00ffd4

    .status-text
      max-width: 340px

    .status-actions
      margin-top: 1rem

      .btn
        margin: 0 0.5rem
`)
