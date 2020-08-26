import React from 'react'
import fbt from 'fbt'

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
      buttonText={fbt('Delete', 'Delete')}
      confirmText={fbt(
        'Are you sure you want to delete this link?',
        'admin.settings.general.social.deleteConfirm'
      )}
      confirmedText={fbt(
        'Link deleted',
        'admin.settings.general.social.deleteSuccess'
      )}
      onConfirm={async () => onConfirm()}
      onSuccess={() => {}}
    />
  )
}

export default AdminDeleteSocialLink
