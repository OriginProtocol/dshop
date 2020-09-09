import React from 'react'
import { useHistory } from 'react-router-dom'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminDeployShop = ({ className = 'btn-outline-primary', buttonText }) => {
  const { config } = useConfig()
  const history = useHistory()
  const { post } = useBackendApi({ authToken: true })
  const [, dispatch] = useStateValue()

  if (!config.walletAddress) {
    return (
      <ConfirmationModal
        className={`btn ${className}`}
        buttonText={buttonText || fbt('Publish', 'Publish')}
        confirmText={fbt(
          'Please setup your crypto wallet first',
          'admin.settings.deployments.connectWallet'
        )}
        confirmedText={false}
        cancelText={fbt('Cancel', 'Cancel')}
        proceedText={fbt('OK', 'OK')}
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
      }}
    />
  )
}

export default AdminDeployShop
