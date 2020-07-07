import React from 'react'
import { useHistory } from 'react-router-dom'

import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeployShop = ({ className = 'btn-outline-primary', buttonText }) => {
  const { config } = useConfig()
  const history = useHistory()
  const { post } = useBackendApi({ authToken: true })
  const [, dispatch] = useStateValue()

  if (!config.listingId) {
    return (
      <ConfirmationModal
        className={`btn ${className}`}
        buttonText={buttonText || 'Deploy'}
        confirmText="Please setup your Web3 wallet first"
        confirmedText={false}
        cancelText="Cancel"
        proceedText="OK"
        onConfirm={() =>
          new Promise((resolve) => {
            history.push('/admin/settings/payments')
            resolve()
          })
        }
      />
    )
  }

  return (
    <ConfirmationModal
      className={`btn ${className}`}
      buttonText={buttonText || 'Deploy'}
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
