import React from 'react'
import get from 'lodash/get'

import Summary from '../../checkout/Summary'

import CustomerInfo from './_CustomerInfo'
import PaymentInfo from './_PaymentInfo'

const AdminOrderDetails = ({ order }) => {
  const cart = get(order, 'data')

  return (
    <div className="order-details row">
      <div className="col-md-6">
        <div className="section-title no-border">Order Summary</div>
        <div className="mb-3">
          <Summary cart={cart} />
        </div>
      </div>
      <div className="col-md-6">
        <div className="section-title">Payment</div>
        <div className="mb-3">
          <PaymentInfo order={order} />
        </div>

        <div className="section-title">Details</div>
        <div className="mb-3">
          <CustomerInfo order={order} />
        </div>
      </div>
    </div>
  )
}

export default AdminOrderDetails

require('react-styl')(`
  .admin
    .order-details
      max-width: 920px
      color: #000

      .section-title
        font-size: 1rem
        font-weight: bold
        margin-bottom: 0.5rem
        margin-top: 1rem
        &:not(.no-border)
          padding-bottom: 0.5rem
          border-bottom: 1px solid #cdd7e0

      .order-summary
        border: 1px solid #cdd7e0
        border-radius: 10px
        padding: 1.25rem

`)
