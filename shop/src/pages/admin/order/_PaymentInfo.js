import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import fbt from 'fbt'

import OfferStates from 'data/OfferStates'

import PaymentActions from './_PaymentActions'

const getStatusText = (orderState, paymentMethod, refundError) => {
  const isCryptoPayment = paymentMethod.id === 'crypto'

  switch (orderState) {
    case OfferStates.Created:
      return isCryptoPayment
        ? fbt(
            `A crypto payment has been made. Make sure you have some ETH to cover gas costs.`,
            'admin.order.cryptoPaymentMade'
          )
        : fbt(
            `A payment has been made with ${fbt.param(
              'paymentMethod',
              paymentMethod.label
            )}.`,
            'admin.order.nonCryptoPayment'
          )

    case OfferStates.Accepted:
      return fbt(
        `The offer made with ${fbt.param(
          'paymentMethod',
          paymentMethod.label
        )} has been accepted. Finalize offer to process the payment.`,
        'admin.order.offerAccepted'
      )
    case OfferStates.Finalized:
      return fbt(
        `Payment made with ${fbt.param(
          'paymentMethod',
          paymentMethod.label
        )} has been accepted and Finalized.`,
        'admin.order.offerFinalized'
      )
    case OfferStates.Withdrawn:
      return refundError
        ? fbt(
            `The offer made with ${fbt.param(
              'paymentMethod',
              paymentMethod.label
            )} has been rejected but refund of payment failed`,
            'admin.order.offerRejectedRefundFailed'
          )
        : fbt(
            `The offer made with ${fbt.param(
              'paymentMethod',
              paymentMethod.label
            )} has been rejected and refunded`,
            'admin.order.offerRejected'
          )
  }
}

const PaymentInfo = ({ order }) => {
  const match = useRouteMatch('/admin/orders/:offerId')
  const { offerId } = match.params

  const cart = get(order, 'data')
  const paymentMethod = get(cart, 'paymentMethod', {})
  const orderState = get(order, 'statusStr')
  const refundError = !!get(order, 'data.refundError')

  if (!cart || !offerId)
    return (
      <div>
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      </div>
    )

  if (orderState === OfferStates.Created) {
    return (
      <div className="order-payment-info">
        <div className="status-text">
          {getStatusText(orderState, paymentMethod, refundError)}
        </div>
        <div className="status-actions">
          <PaymentActions order={order} />
        </div>
      </div>
    )
  } else if (orderState === OfferStates.Accepted) {
    return (
      <div className="order-payment-info">
        <div className="status-text">
          {fbt(
            `The offer made with ${fbt.param(
              'paymentMethod',
              paymentMethod.label
            )} has been accepted. Finalize offer to process the payment.`,
            'admin.order.offerAccepted'
          )}
        </div>
        <div className="status-actions">
          <PaymentActions order={order} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`order-payment-info${
        orderState === OfferStates.Finalized ? ' completed' : ''
      }${refundError ? ' error' : ''}`}
    >
      <div className="status-text">
        {getStatusText(orderState, paymentMethod, refundError)}
      </div>
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

    &.error
      color: red

    .status-text
      max-width: 340px

    .status-actions
      margin-top: 1rem
`)
