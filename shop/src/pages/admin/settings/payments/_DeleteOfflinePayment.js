import React from 'react'

import ConfirmationModal from 'components/ConfirmationModal'

const DeleteModal = ({
  paymentMethod,
  className = '',
  children,
  onConfirm
}) => {
  return (
    <ConfirmationModal
      className={`${className || 'btn btn-outline-danger'}`}
      buttonText={<>{children || 'Delete'}</>}
      confirmText={`Are you sure you want to delete ${paymentMethod.label}?`}
      confirmedText={`${paymentMethod.label} deleted`}
      onConfirm={onConfirm}
    />
  )
}

export default DeleteModal
