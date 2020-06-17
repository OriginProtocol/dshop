import React from 'react'

// import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeleteSocialLink = ({ className = '' }) => {
  // const { post } = useBackendApi({ authToken: true })

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
      onConfirm={() => {
        // post(`/discounts/${discount.id}`, { method: 'DELETE' })
        console.log('deleted')
        return new Promise((resolve) => resolve())
      }}
      onSuccess={() => {}}
    />
  )
}

export default AdminDeleteSocialLink
