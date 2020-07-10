import React, { useState } from 'react'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import useRedirect from 'utils/useRedirect'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteShop = ({ shop, className = '' }) => {
  const redirectTo = useRedirect()
  const [, dispatch] = useStateValue()
  const [deleteCache, setDeleteCache] = useState(false)

  const { post } = useBackendApi()

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      loadingText={false}
      confirmText="Are you sure you want to delete this shop?"
      confirmedText={false}
      onConfirm={() => {
        const body = JSON.stringify({ deleteCache })
        return post(`/shops/${shop.authToken}`, { method: 'DELETE', body })
      }}
      onSuccess={() => {
        redirectTo('/super-admin/shops')
        dispatch({ type: 'reload', target: 'auth' })
      }}
    >
      <div className="mt-4">
        <label className="m-0">
          <input
            checked={deleteCache}
            onChange={(e) => setDeleteCache(e.target.checked)}
            type="checkbox"
            className="mr-2"
          />{' '}
          Delete data from cache
        </label>
      </div>
    </ConfirmationModal>
  )
}

export default AdminDeleteShop
