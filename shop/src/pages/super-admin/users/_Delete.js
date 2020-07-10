import React from 'react'

import useRedirect from 'utils/useRedirect'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteUser = ({ userId }) => {
  const redirectTo = useRedirect()
  const { post } = useBackendApi()

  return (
    <ConfirmationModal
      className="btn btn-outline-danger ml-2"
      buttonText="Delete"
      confirmText="Are you sure you wish to delete this user?"
      confirmedText="User deleted successfully"
      onConfirm={() => post(`/superuser/users/${userId}`, { method: 'DELETE' })}
      onSuccess={() => redirectTo('/super-admin/users')}
    />
  )
}

export default AdminDeleteUser
