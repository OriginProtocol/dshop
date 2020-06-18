import React from 'react'
import { useHistory } from 'react-router-dom'

import ConfirmationModal from 'components/ConfirmationModal'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import useCollections from 'utils/useCollections'

const AdminDeleteDiscount = ({ className = '', collection }) => {
  const history = useHistory()
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
        history.push({
          pathname: '/admin/collections',
          state: { scrollToTop: true }
        })
      }}
    />
  )
}

export default AdminDeleteDiscount
