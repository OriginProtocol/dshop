import React from 'react'
import fbt, { FbtParam } from 'fbt'
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
      buttonText={<>{children || <fbt desc="Delete">Delete</fbt>}</>}
      confirmText={
        <fbt desc="admin.settings.payments.OfflinePayments.confirmDelete">
          Are you sure you want to delete{' '}
          <FbtParam name="methodName">{paymentMethod.label}</FbtParam>?
        </fbt>
      }
      confirmedText={
        <fbt desc="admin.settings.payments.OfflinePayments.deleteSuccess">
          <FbtParam name="methodName">{paymentMethod.label}</FbtParam> deleted
        </fbt>
      }
      onConfirm={onConfirm}
    />
  )
}

export default DeleteModal
