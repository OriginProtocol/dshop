import React, { useReducer } from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useOfferData from 'utils/useOfferData'
import useConfig from 'utils/useConfig'
import useOrigin from 'utils/useOrigin'

import {
  acceptOffer,
  withdrawOffer,
  finalizeOffer,
  waitForOfferStatus
} from 'utils/offer'

import Web3Transaction from 'components/Web3Transaction'

const reducer = (state, newState) => ({ ...state, ...newState })

const OfferStates = {
  Created: 'OfferCreated',
  Accepted: 'OfferAccepted',
  Finalized: 'OfferFinalized',
  Withdrawn: 'OfferWithdrawn',
  Disputed: 'OfferDisputed'
}

const getStatusText = (orderState, paymentMethod, refundError) => {
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
      return `The offer made with ${paymentMethod.label} has been rejected ${
        refundError ? 'but refund of payment failed' : 'and refunded'
      }.`
  }
}

const PaymentInfo = ({ order }) => {
  const match = useRouteMatch('/admin/orders/:offerId')
  const { offerId } = match.params

  const { config } = useConfig()
  const { marketplace } = useOrigin()
  const [, dispatch] = useStateValue()
  const { sellerProxy, listing, offer } = useOfferData(offerId)
  const [state, setState] = useReducer(reducer, {})

  const cart = get(order, 'data')
  const paymentMethod = get(cart, 'paymentMethod', {})
  const orderState = get(order, 'statusStr')
  const refundError = !!get(order, 'data.refundError')

  if (!cart) return <div>Loading...</div>

  if (orderState === OfferStates.Created) {
    return (
      <div className="order-payment-info">
        <div className="status-text">
          {getStatusText(orderState, paymentMethod, refundError)}
        </div>
        <div className="status-actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setState({ acceptOffer: true })}
            children="Accept Payment"
          />
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => setState({ withdrawOffer: true })}
            children="Reject & Refund"
          />
          <Web3Transaction
            dependencies={[marketplace]}
            account={get(listing, 'seller')}
            shouldSubmit={state.acceptOffer}
            execTx={() =>
              acceptOffer({ marketplace, offerId, sellerProxy, config })
            }
            awaitTx={() =>
              waitForOfferStatus({ marketplace, offerId, status: 2 })
            }
            onSuccess={() =>
              dispatch({ type: 'reload', target: `order-${offerId}` })
            }
            onReset={() => setState({ acceptOffer: false })}
          />
          <Web3Transaction
            dependencies={[marketplace]}
            account={get(listing, 'seller')}
            shouldSubmit={state.withdrawOffer}
            execTx={() =>
              withdrawOffer({ marketplace, offerId, sellerProxy, config })
            }
            awaitTx={() =>
              waitForOfferStatus({ marketplace, offerId, status: 0 })
            }
            onSuccess={() =>
              dispatch({ type: 'reload', target: `order-${offerId}` })
            }
            onReset={() => setState({ withdrawOffer: false })}
          />
        </div>
      </div>
    )
  } else if (orderState === OfferStates.Accepted) {
    return (
      <div className="order-payment-info">
        <div className="status-text">
          The offer made with {paymentMethod.label} has been accepted. Finalize
          offer to process the payment.
        </div>
        <div className="status-actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setState({ finalizeOffer: true })}
            children="Finalize Purchase"
          />
          <Web3Transaction
            dependencies={[marketplace]}
            account={[get(offer, 'buyer'), get(listing, 'seller')]}
            shouldSubmit={state.finalizeOffer}
            execTx={() =>
              finalizeOffer({ marketplace, offerId, sellerProxy, config })
            }
            awaitTx={() =>
              waitForOfferStatus({ marketplace, offerId, status: 0 })
            }
            onSuccess={() =>
              dispatch({ type: 'reload', target: `order-${offerId}` })
            }
            onReset={() => setState({ finalizeOffer: false })}
          />
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

      .btn
        margin: 0 0.5rem
`)
