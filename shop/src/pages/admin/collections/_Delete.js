import React from 'react'

import ConfirmationModal from 'components/ConfirmationModal'
import useBackendApi from 'utils/useBackendApi'
import useRedirect from 'utils/useRedirect'
import { useStateValue } from 'data/state'
import useCollections from 'utils/useCollections'

const AdminDeleteDiscount = ({ className = '', collection }) => {
  const redirectTo = useRedirect()
  const [, dispatch] = useStateValue()
  const { collections } = useCollections()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this collection?"
      confirmedText="Collection deleted"
      onConfirm={() =>
        post('/collections', {
          method: 'PUT',
          body: JSON.stringify({
            collections: collections.filter((c) => c.id !== collection.id)
          })
        })
      }
      onSuccess={() => {
        dispatch({ type: 'reload', target: 'collections' })
        redirectTo('/admin/collections')
      }}
    />
  )
}

export default AdminDeleteDiscount
