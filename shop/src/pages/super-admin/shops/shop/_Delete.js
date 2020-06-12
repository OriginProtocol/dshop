import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteShop = ({ shop, className = '' }) => {
  const history = useHistory()
  const [, dispatch] = useStateValue()
  const [deleteCache, setDeleteCache] = useState(false)

  const { post } = useBackendApi()

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this shop?"
      confirmedText="Shop deleted"
      onConfirm={() =>
        post(`/shops/${shop.authToken}`, {
          method: 'DELETE',
          body: JSON.stringify({
            deleteCache
          })
        })
      }
      onSuccess={() => {
        history.push({
          pathname: '/super-admin/shops',
          state: { scrollToTop: true }
        })
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
