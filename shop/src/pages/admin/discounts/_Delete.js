import React from 'react'

import useRedirect from 'utils/useRedirect'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteDiscount = ({
  reload,
  discount,
  className = '',
  children
}) => {
  const redirectTo = useRedirect()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      customEl={children}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this discount?"
      confirmedText="Discount deleted"
      onConfirm={() => post(`/discounts/${discount.id}`, { method: 'DELETE' })}
      onSuccess={() => {
        reload ? reload() : redirectTo('/admin/discounts')
      }}
    />
  )
}

export default AdminDeleteDiscount
