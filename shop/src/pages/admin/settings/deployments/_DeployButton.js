import React from 'react'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeployShop = ({ className = '' }) => {
  const { post } = useBackendApi({ authToken: true })
  const [, dispatch] = useStateValue()

  return (
    <ConfirmationModal
      className={`btn btn-outline-primary ${className}`}
      buttonText="Deploy"
      confirmText="Are you sure you want to deploy?"
      confirmedText="Deployed OK"
      loadingText="Deploying..."
      onConfirm={() => post(`/shop/deploy`)}
      onSuccess={() => {
        dispatch({ type: 'hasChanges', value: false })
        dispatch({ type: 'reload', target: 'deployments' })
      }}
    />
  )
}

export default AdminDeployShop
