import React from 'react'
import { useHistory } from 'react-router-dom'

import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteUser = ({ userId }) => {
  const history = useHistory()
  const { post } = useBackendApi()

  return (
    <ConfirmationModal
      className="btn btn-outline-danger ml-2"
      buttonText="Delete"
      confirmText="Are you sure you wish to delete this user?"
      confirmedText="User deleted successfully"
      onConfirm={() => post(`/superuser/users/${userId}`, { method: 'DELETE' })}
      onSuccess={() => {
        history.push({
          pathname: '/super-admin/users',
          state: { scrollToTop: true }
        })
      }}
    />
  )
}

export default AdminDeleteUser
