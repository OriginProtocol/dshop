import React from 'react'

import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const DisconnectModal = ({ processor, className = '', afterDelete }) => {
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`${className || 'btn btn-outline-danger'}`}
      buttonText="Disconnect"
      confirmText={`Are you sure you want to disconnect ${processor.title}?`}
      confirmedText={`${processor.title} disconnected`}
      onConfirm={() => {
        let updatedConfig = {}
        switch (processor.id) {
          case 'stripe':
            updatedConfig = {
              stripe: false,
              stripeKey: '',
              stripeBackend: '',
              stripeWebhookSecret: ''
            }
            break
          case 'uphold':
            updatedConfig = {
              upholdApi: '',
              upholdClient: '',
              upholdSecret: ''
            }
            break
          case 'web3':
            updatedConfig = {
              web3Pk: ''
            }
            break
          case 'printful':
            updatedConfig = {
              printful: '',
              printfulAutoFulfill: false
            }
            break
          case 'sendgrid':
            updatedConfig = {
              email: '',
              sendgridUsername: '',
              sendgridPassword: '',
              sendgridApiKey: ''
            }
            break
          case 'aws':
            updatedConfig = {
              email: '',
              awsRegion: '',
              awsAccessKey: '',
              awsAccessSecret: ''
            }
            break
          case 'mailgun':
            updatedConfig = {
              email: '',
              mailgunSmtpServer: '',
              mailgunSmtpPort: '',
              mailgunSmtpLogin: '',
              mailgunSmtpPassword: ''
            }
            break
          case 'paypal':
            updatedConfig = {
              paypal: false,
              paypalClientId: '',
              paypalClientSecret: ''
            }
            break
        }

        return post('/shop/config', {
          method: 'PUT',
          body: JSON.stringify(updatedConfig)
        })
      }}
      onSuccess={async () => {
        if (afterDelete) afterDelete()
      }}
    />
  )
}

export default DisconnectModal
