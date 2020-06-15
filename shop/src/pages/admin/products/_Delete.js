import React from 'react'
import { useHistory } from 'react-router-dom'

import useProducts from 'utils/useProducts'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const DeleteProduct = ({ product, className = '' }) => {
  const history = useHistory()
  const { post } = useBackendApi({ authToken: true })
  const { refetch } = useProducts()

  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      buttonText="Delete"
      confirmText="Are you sure you want to delete this product?"
      confirmedText="Product deleted"
      onConfirm={() => post(`/products/${product.id}`, { method: 'DELETE' })}
      onSuccess={async () => {
        await refetch()
        history.push({
          pathname: '/admin/products',
          state: { scrollToTop: true }
        })
      }}
    />
  )
}

export default DeleteProduct
