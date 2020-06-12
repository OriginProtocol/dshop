import React from 'react'

import useBackendApi from 'utils/useBackendApi'

import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteAsset = ({ file, shop, className = '', onSuccess }) => {
  const { post } = useBackendApi()

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this asset?"
      confirmedText="Asset deleted"
      onConfirm={() =>
        post(`/shops/${shop.authToken}/assets`, {
          method: 'DELETE',
          body: JSON.stringify({ file })
        })
      }
      onSuccess={onSuccess}
    />
  )
}

export default AdminDeleteAsset
