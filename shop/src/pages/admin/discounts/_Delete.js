import React from 'react'
import { useHistory } from 'react-router-dom'

import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteDiscount = ({ discount, className = '' }) => {
  const history = useHistory()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this discount?"
      confirmedText="Discount deleted"
      onConfirm={() => post(`/discounts/${discount.id}`, { method: 'DELETE' })}
      onSuccess={() => {
        history.push({
          pathname: '/admin/discounts',
          state: { scrollToTop: true }
        })
      }}
    />
  )
}

export default AdminDeleteDiscount
