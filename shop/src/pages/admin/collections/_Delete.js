import React from 'react'
import { useHistory } from 'react-router-dom'

import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteDiscount = ({ className = '' }) => {
  const history = useHistory()

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this collection?"
      confirmedText="Collection deleted"
      onConfirm={() => new Promise((resolve) => resolve())}
      onSuccess={() => {
        history.push({
          pathname: '/admin/collections',
          state: { scrollToTop: true }
        })
      }}
    />
  )
}

export default AdminDeleteDiscount
