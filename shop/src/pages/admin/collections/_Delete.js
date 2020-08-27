import React from 'react'

import fbt from 'fbt'

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
      buttonText={fbt('Delete', 'Delete')}
      confirmText={fbt(
        'Are you sure you want to delete this collection?',
        'admin.collections.confirmDelete'
      )}
      confirmedText={false}
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
        dispatch({
          type: 'toast',
          message: fbt('Deleted OK', 'admin.collections.deleteSuccess')
        })
        redirectTo('/admin/collections')
      }}
    />
  )
}

export default AdminDeleteDiscount
