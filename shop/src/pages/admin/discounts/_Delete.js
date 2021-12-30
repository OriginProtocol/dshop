import React from 'react'

import fbt from 'fbt'

import useRedirect from 'utils/useRedirect'
import useBackendApi from 'utils/useBackendApi'
import AdminConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteDiscount = ({
  reload,
  discount,
  className = '',
  children
}) => {
  const redirectTo = useRedirect()
  const { post } = useBackendApi({ authToken: true })

  return (
    <AdminConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      customEl={children}
      buttonText={fbt('Delete', 'Delete')}
      confirmText={fbt(
        'Are you sure you want to delete this discount?',
        'admin.discounts.confirmDelete'
      )}
      confirmedText={fbt('Discount deleted', 'admin.discounts.deleteSuccess')}
      onConfirm={() => post(`/discounts/${discount.id}`, { method: 'DELETE' })}
      onSuccess={() => {
        reload ? reload() : redirectTo('/admin/discounts')
      }}
    />
  )
}

export default AdminDeleteDiscount
