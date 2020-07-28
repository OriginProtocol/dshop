import React, { useState } from 'react'

import ManualPaymentModal from './_ManualPaymentModal'
import DeleteButton from './_DeleteManualPayment'

const ManualPayment = ({ manualPaymentMethods, onChange }) => {
  const paymentMethods = manualPaymentMethods || []

  const [editMethod, setEditMethod] = useState()

  const updateCheckedState = (methodId, checked) => {
    const updatedMethods = paymentMethods.map((m) => {
      if (m.id === methodId) {
        return {
          ...m,
          disabled: !checked
        }
      }

      return m
    })

    onChange({
      manualPaymentMethods: updatedMethods
    })
  }

  return (
    <div className="manual-payment contract-settings">
      <h4>Manual payment methods</h4>
      <div className="desc">
        Payments that are processed outside your online store. When a customer
        makes a manual payment, you need to approve their order before
        fulfilling.
      </div>

      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className="form-check manual-payment-checkboxes my-2"
        >
          <label className="form-check-label">
            <input
              type="checkbox"
              className="form-check-input"
              checked={!method.disabled}
              onChange={(e) => updateCheckedState(method.id, e.target.checked)}
            />
            {method.name}
          </label>
          <div className="actions">
            <div className="action-icon" onClick={() => setEditMethod(method)}>
              <img src="images/edit-icon.svg" />
            </div>
            <DeleteButton
              paymentMethod={method}
              className="action-icon"
              onConfirm={async () => {
                onChange({
                  manualPaymentMethods: manualPaymentMethods.filter(
                    (m) => m.id !== method.id
                  )
                })
              }}
            >
              <img src="images/delete-icon.svg" />
            </DeleteButton>
          </div>
        </div>
      ))}

      <ManualPaymentModal
        paymentMethod={editMethod}
        onClose={() => setEditMethod(null)}
        onUpdate={(method) => {
          const allMethods = [...paymentMethods]
          const existingIndex = allMethods.findIndex((m) => m.id === method.id)

          if (existingIndex >= 0) {
            allMethods[existingIndex] = method
          } else {
            allMethods[allMethods.length] = method
          }

          onChange({
            manualPaymentMethods: allMethods
          })
        }}
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
    .manual-payment-checkboxes
      display: flex

      .actions
        margin-left: 0.5rem
        visibility: hidden
        display: flex

      &:hover .actions
        visibility: visible

      .action-icon
        cursor: pointer
        margin-left: 0.5rem
        border: 0
        background-color: transparent
      
`)
