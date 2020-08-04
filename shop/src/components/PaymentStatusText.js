import React from 'react'

import OfferStates from 'data/OfferStates'

const PaymentStatusText = ({ status }) => {
  const classList = ['order-payment-status']
  let labelText = 'Pending'

  switch (status) {
    case OfferStates.Created:
      classList.push('pending')
      labelText = 'Pending'
      break

    case OfferStates.Accepted:
    case OfferStates.Finalized:
      classList.push('paid')
      labelText = 'Paid'
      break

    case OfferStates.Withdrawn:
      classList.push('rejected')
      labelText = 'Canceled'
      break
  }

  return <div className={classList.join(' ')}>{labelText}</div>
}

export default PaymentStatusText

require('react-styl')(`
  .order-payment-status
    display: flex
    align-items: center
    &:before
      content: ''
      display: inline-block
      width: 10px
      height: 10px
      background-color: #fec100
      border-radius: 50%
      margin-right: 0.5rem
    &.paid:before
      background-color: #00d592
    &.rejected:before
      background-color: #c9444a
`)
