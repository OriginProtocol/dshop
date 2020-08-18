import React from 'react'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminPrintfulSync = ({ buttonText, buttonClass, className = '' }) => {
  const { post } = useBackendApi({ authToken: true })
  const [, dispatch] = useStateValue()

  return (
    <ConfirmationModal
      className={`${buttonClass || 'btn btn-outline-primary'} ${className}`}
      buttonText={buttonText || fbt('Sync', 'Sync')}
      confirmText={fbt(
        'Are you sure you want to sync with Printful?',
        'admin.settings.apps.printful.confirmSync'
      )}
      confirmedText={fbt('Synced OK', 'admin.settings.apps.printful.synced')}
      loadingText={`${fbt('Syncing', 'Syncing')}...`}
      onConfirm={() => post(`/shop/sync-printful`)}
      onSuccess={async () => {
        dispatch({ type: 'reload', target: 'products' })
      }}
    />
  )
}

export default AdminPrintfulSync
