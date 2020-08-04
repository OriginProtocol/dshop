import React, { useReducer } from 'react'
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

import OfferStates from 'data/OfferStates'

const reducer = (state, newState) => ({ ...state, ...newState })

const PaymentActions = ({ order }) => {
  const offerId = get(order, 'orderId', '')

  const { config } = useConfig()
  const { marketplace } = useOrigin()
  const [, dispatch] = useStateValue()
  const { sellerProxy, listing, offer } = useOfferData(offerId)
  const [state, setState] = useReducer(reducer, {})

  const cart = get(order, 'data')
  const orderState = get(order, 'statusStr')

  if (!cart || !offerId) return null

  const isOfflinePayment = !!get(cart, 'paymentMethod.instructions')

  let actions = null

  if (orderState === OfferStates.Created) {
    actions = (
      <>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setState({ acceptOffer: true })}
          children={isOfflinePayment ? 'Mark as Paid' : 'Accept Payment'}
        />
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={() => setState({ withdrawOffer: true })}
          children={isOfflinePayment ? 'Reject' : 'Reject & Refund'}
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
      </>
    )
  } else if (orderState === OfferStates.Accepted) {
    actions = (
      <>
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
      </>
    )
  }

  return !actions ? null : (
    <div
      className="payment-status-actions"
      onClick={(e) => e.stopPropagation()}
    >
      {actions}
    </div>
  )
}

export default PaymentActions

require('react-styl')(`
  .payment-status-actions
    .btn
      margin: 0 0.5rem
`)
