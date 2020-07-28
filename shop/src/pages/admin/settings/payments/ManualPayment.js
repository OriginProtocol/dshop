import React, { useState } from 'react'
import get from 'lodash/get'
import { useStateValue } from 'data/state'
import ManualPaymentModal from './_ManualPaymentModal'

const ManualPayment = () => {
  const [{ config }] = useStateValue()
  const manualPaymentMethods = get(config, 'manualPaymentMethods', [])

  const [editMethod, setEditMethod] = useState()

  return (
    <div className="manual-payment contract-settings">
      <h4>Manual payment methods</h4>
      <div className="desc">
        Payments that are processed outside your online store. When a customer
        makes a manual payment, you need to approve their order before
        fulfilling.
      </div>

      {manualPaymentMethods.map((method) => (
        <div key={method.id} onClick={() => setEditMethod(method)}>
          {method.name}
        </div>
      ))}

      <ManualPaymentModal
        paymentMethod={editMethod}
        onClose={() => setEditMethod(null)}
      />
    </div>
  )
}

export default ManualPayment

require('react-styl')(`
  .manual-payment
    .desc
      color: #8293a4
      font-size: 0.875rem
      max-width: 500px
`)
