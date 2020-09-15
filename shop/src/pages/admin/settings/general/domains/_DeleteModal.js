import React from 'react'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteDomain = ({ domain, className = '', children }) => {
  const [, dispatch] = useStateValue()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      customEl={<div>{children}</div>}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this domain?"
      confirmedText="Domain deleted"
      onConfirm={() => post(`/shop/domains/${domain.id}`, { method: 'DELETE' })}
      onSuccess={() => dispatch({ type: 'reload', target: 'domains' })}
    />
  )
}

export default AdminDeleteDomain
