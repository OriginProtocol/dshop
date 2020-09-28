import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import fbt from 'fbt'
import dayjs from 'dayjs'

import PaymentStates from 'data/PaymentStates'
import OfferStates from 'data/OfferStates'

import PaymentActions from './_PaymentActions'
import OffchainPaymentActions from './_OffchainPaymentActions'

const getStatusText = (
  paymentState,
  offerState,
  paymentMethod,
  refundError
) => {
  const isCryptoPayment = paymentMethod.id === 'crypto'

  if (!offerState) {
    // An undefined offerStatus indicates the order was recorded off-chain.
    // Look at the paymentStatus to determine what text to show to the merchant.
    switch (paymentState) {
      case PaymentStates.Paid:
        return fbt(
          `A payment was made with ${fbt.param(
            'paymentMethod',
            paymentMethod.label
          )}.`,
          'admin.order.paymentStatusPaid'
        )
      case PaymentStates.Refunded:
        return fbt(
          `A payment made with ${fbt.param(
            'paymentMethod',
            paymentMethod.label
          )} was refunded.`,
          'admin.order.paymentStatusRefunded'
        )

      case PaymentStates.Pending:
        return fbt(`A payment is pending`, 'admin.order.paymentStatusPending')

      case PaymentStates.Rejected:
        return fbt(
          `A payment was rejected`,
          'admin.order.paymentStatusRejected'
        )

      default:
        return fbt('Payment status unknown', 'admin.order.unknownPaymentStatus')
    }
  }

  switch (offerState) {
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
  const paymentState = get(order, 'paymentStatus')
  const offerState = get(order, 'offerStatus')
  const refundError = Boolean(get(order, 'data.refundError'))
  const transactions = get(order, 'transactions', [])

  const offchainPaymentTx = transactions.find((t) => t.type === 'Payment')
  const isOffchainPayment = Boolean(offchainPaymentTx) || !get(order, 'offerId')

  if (!cart || !offerId) {
    return (
      <div>
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      </div>
    )
  }

  // Direct crypto payment.
  if (isOffchainPayment) {
    if (!offchainPaymentTx) {
      // Offchain non-crypto payments
      return (
        <div className="order-payment-info">
          <div className="status-text">
            {getStatusText(
              paymentState,
              offerState,
              paymentMethod,
              refundError
            )}
          </div>
          <div className="status-actions">
            <OffchainPaymentActions order={order} />
          </div>
        </div>
      )
    }

    // Offchain crypto payments
    return (
      <div className="admin-customer-info">
        <div>
          <div>
            <fbt desc="Date">Date</fbt>
          </div>
          <div>
            {dayjs(offchainPaymentTx.createdAt).format('MMM D, h:mm A')}
          </div>
        </div>
        <div>
          <div>
            <fbt desc="From">From</fbt>
          </div>
          <div>{offchainPaymentTx.fromAddress}</div>
        </div>
        <div>
          <div>
            <fbt desc="To">To</fbt>
          </div>
          <div>{offchainPaymentTx.toAddress}</div>
        </div>
        <div>
          <div>
            <fbt desc="Hash">Hash</fbt>
          </div>
          <div>{offchainPaymentTx.hash}</div>
        </div>
      </div>
    )
  }

  if (!offerState) {
    // An undefined offerStatus indicates the order was recorded off-chain
    return (
      <div className="order-payment-info">
        <div className="status-text">
          {getStatusText(paymentState, offerState, paymentMethod, refundError)}
        </div>
        <div className="status-actions">
          <PaymentActions order={order} />
        </div>
      </div>
    )
  } else if (offerState === OfferStates.Created) {
    return (
      <div className="order-payment-info">
        <div className="status-text">
          {getStatusText(paymentState, offerState, paymentMethod, refundError)}
        </div>
        <div className="status-actions">
          <PaymentActions order={order} />
        </div>
      </div>
    )
  } else if (offerState === OfferStates.Accepted) {
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
        offerState === OfferStates.Finalized ? ' completed' : ''
      }${refundError ? ' error' : ''}`}
    >
      <div className="status-text">
        {getStatusText(paymentState, offerState, paymentMethod, refundError)}
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
