import React from 'react'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminPrintfulSync = ({ className = '' }) => {
  const { post } = useBackendApi({ authToken: true })
  const [, dispatch] = useStateValue()

  return (
    <ConfirmationModal
      className={`btn btn-outline-primary ${className}`}
      buttonText="Sync"
      confirmText="Are you sure you want to sync with Printful?"
      confirmedText="Synced OK"
      loadingText="Syncing..."
      onConfirm={() => post(`/shop/sync-printful`)}
      onSuccess={async () => {
        dispatch({ type: 'reload', target: 'products' })
      }}
    />
  )
}

export default AdminPrintfulSync
