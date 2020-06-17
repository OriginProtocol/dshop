import React from 'react'
import { useHistory } from 'react-router-dom'

import useProducts from 'utils/useProducts'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const DeleteProduct = ({ product, className = '', children }) => {
  const history = useHistory()
  const { post } = useBackendApi({ authToken: true })
  const { refetch } = useProducts()

  return (
    <ConfirmationModal
      className={`${className || 'btn btn-outline-danger'}`}
      buttonText={<>{children || 'Delete'}</>}
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
