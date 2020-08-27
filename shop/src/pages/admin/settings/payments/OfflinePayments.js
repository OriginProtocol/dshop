import React, { useState } from 'react'
import fbt from 'fbt'

import OfflinePaymentModal from './_OfflinePaymentModal'
import DeleteButton from './_DeleteOfflinePayment'

const OfflinePayment = ({ offlinePaymentMethods, onChange }) => {
  const paymentMethods = offlinePaymentMethods || []

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
      offlinePaymentMethods: updatedMethods
    })
  }

  return (
    <div className="manual-payment contract-settings">
      <h4>
        <fbt desc="admin.settins.payments.offlinePayments.title">
          Manual payment methods
        </fbt>
      </h4>
      <div className="desc">
        <fbt desc="admin.settins.payments.offlinePayments.desc">
          Payments that are processed outside your online store. When a customer
          makes a manual payment, you need to approve their order before
          fulfilling.
        </fbt>
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
            {method.label}
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
                  offlinePaymentMethods: offlinePaymentMethods.filter(
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

      <OfflinePaymentModal
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
            offlinePaymentMethods: allMethods
          })
        }}
      />
    </div>
  )
}

export default OfflinePayment

require('react-styl')(`
  .manual-payment
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
