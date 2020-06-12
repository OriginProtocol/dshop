import React from 'react'
import { useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteShop = ({ shop, className = '' }) => {
  const history = useHistory()
  const [, dispatch] = useStateValue()

  const { post } = useBackendApi()

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      children="Delete"
      confirmText="Are you sure you want to delete this shop?"
      confirmedText="Shop deleted"
      onConfirm={() => post(`/shops/${shop.authToken}`, { method: 'DELETE' })}
      onSuccess={() => {
        history.push({
          pathname: '/super-admin/shops',
          state: { scrollToTop: true }
        })
        dispatch({ type: 'reload', target: 'auth' })
      }}
    />
  )
}

export default AdminDeleteShop
