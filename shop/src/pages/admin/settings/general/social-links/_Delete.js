import React from 'react'

import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteSocialLink = ({ className = '', onConfirm }) => {
  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      customEl={
        <a href="#remove" className={className}>
          <img src="images/delete-icon.svg" />
        </a>
      }
      buttonText="Delete"
      confirmText="Are you sure you want to delete this link?"
      confirmedText="Link deleted"
      onConfirm={async () => onConfirm()}
      onSuccess={() => {}}
    />
  )
}

export default AdminDeleteSocialLink
