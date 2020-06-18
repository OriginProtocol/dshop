import React from 'react'
import { useHistory } from 'react-router-dom'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const DeleteProduct = ({ product, className = '', children }) => {
  const history = useHistory()
  const [, dispatch] = useStateValue()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`${className || 'btn btn-outline-danger'}`}
      buttonText={<>{children || 'Delete'}</>}
      confirmText="Are you sure you want to delete this product?"
      confirmedText="Product deleted"
      onConfirm={() => post(`/products/${product.id}`, { method: 'DELETE' })}
      onSuccess={async () => {
        dispatch({ type: 'reload', target: 'products' })
        history.push({
          pathname: '/admin/products',
          state: { scrollToTop: true }
        })
      }}
    />
  )
}

export default DeleteProduct
