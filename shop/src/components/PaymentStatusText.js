import React from 'react'
import fbt from 'fbt'
import PaymentStates from 'data/PaymentStates'

const PaymentStatusText = ({ status }) => {
  const classList = ['order-payment-status']
  let labelText

  switch (status) {
    case PaymentStates.Paid:
      classList.push('paid')
      labelText = fbt('Paid', 'Paid')
      break

    case PaymentStates.Refunded:
      classList.push('rejected')
      labelText = fbt('Refunded', 'Refunded')
      break

    case PaymentStates.Pending:
      classList.push('pending')
      labelText = fbt('Pending', 'Pending')
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
