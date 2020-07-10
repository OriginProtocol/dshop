import React from 'react'

import useRedirect from 'utils/useRedirect'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteDiscount = ({ discount, className = '' }) => {
  const redirectTo = useRedirect()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this discount?"
      confirmedText="Discount deleted"
      onConfirm={() => post(`/discounts/${discount.id}`, { method: 'DELETE' })}
      onSuccess={() => redirectTo('/admin/discounts')}
    />
  )
}

export default AdminDeleteDiscount
