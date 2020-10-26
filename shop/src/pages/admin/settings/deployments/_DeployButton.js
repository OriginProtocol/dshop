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
  const { get, post } = useBackendApi({ authToken: true })
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
      confirmedSubText={fbt(
        "We're in the process of deploying your shop to a global content distribution network and the Interplanetary File System (IPFS). It may take up to 15 minutes for all changes to take effect. Please be patient.",
        'admin.settings.deployments.confirmedSubText'
      )}
      loadingText={`${fbt('Publishing', 'Publishing')}...`}
      spinner={true}
      onConfirm={() => {
        return new Promise((resolve, reject) => {
          post(`/shop/deploy`, { suppressError: true }).then((res) => {
            const { success, uuid, error } = res
            if (success) {
              // Check for the deployment to complete
              const interval = setInterval(() => {
                get(`/shop/deployment/${uuid}`).then((dres) => {
                  const { deployment } = dres
                  if (deployment && deployment.status === 'Success') {
                    clearInterval(interval)
                    resolve(dres)
                  } else if (deployment && deployment.status === 'Pending') {
                    console.debug(`Deployment ${uuid} is in progress...`)
                  } else {
                    clearInterval(interval)
                    reject(new Error(dres.error ? dres.error : 'Deploy failed'))
                  }
                })
              }, 1000)
            } else if (error) {
              reject(new Error(error.message))
            }
          })
        })
      }}
      onSuccess={() => {
        dispatch({ type: 'reload', target: 'deployments' })
        dispatch({ type: 'reload', target: 'shopConfig' })
        if (afterDeploy) afterDeploy()
      }}
    />
  )
}

export default AdminDeployShop
