import React, { useState } from 'react'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminPrintfulSync = ({ buttonText, buttonClass, className = '' }) => {
  const { post } = useBackendApi({ authToken: true })
  const [{ admin }, dispatch] = useStateValue()
  const [refreshImages, setRefreshImages] = useState(false)

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
      onConfirm={() =>
        post(`/shop/sync-printful`, {
          body: JSON.stringify({ refreshImages })
        })
      }
      onSuccess={async () => {
        dispatch({ type: 'reload', target: 'products' })
      }}
    >
      {!admin.superuser ? null : (
        <div className="form-row mt-3 justify-content-center">
          <label className="m-0">
            <input
              type="checkbox"
              className="mr-2"
              checked={refreshImages}
              onChange={(e) => setRefreshImages(e.target.checked)}
            />{' '}
            Force refresh images
          </label>
        </div>
      )}
    </ConfirmationModal>
  )
}

export default AdminPrintfulSync
