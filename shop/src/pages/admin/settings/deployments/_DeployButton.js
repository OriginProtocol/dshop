import React from 'react'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeployShop = ({
  className = 'btn-outline-primary',
  buttonText,
  afterDeploy
}) => {
  const { post } = useBackendApi({ authToken: true })
  const [, dispatch] = useStateValue()

  return (
    <ConfirmationModal
      className={`btn ${className}`}
      buttonText={buttonText || fbt('Publish', 'Publish')}
      confirmText={fbt(
        'Are you sure you want to publish changes?',
        'admin.settings.deployments.publishConfirm'
      )}
      confirmedText={fbt(
        'Your changes have been successfully published.',
        'admin.settings.deployments.publishedText'
      )}
      loadingText={`${fbt('Publishing', 'Publishing')}...`}
      spinner={true}
      onConfirm={() => post(`/shop/deploy`)}
      onSuccess={() => {
        dispatch({ type: 'reload', target: 'deployments' })
        dispatch({ type: 'reload', target: 'shopConfig' })
        if (afterDeploy) afterDeploy()
      }}
    />
  )
}

export default AdminDeployShop
