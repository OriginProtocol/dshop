import React from 'react'
import fbt, { FbtParam } from 'fbt'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const DisconnectModal = ({ processor, className = '', afterDelete }) => {
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      className={`${className || 'btn btn-outline-danger'}`}
      buttonText={fbt('Disconnect', 'Disconnect')}
      confirmText={
        <fbt desc="admin.settings.payments.confirmDisconnect">
          Are you sure you want to disconnect{' '}
          <FbtParam name="processorName">{processor.title}</FbtParam>?
        </fbt>
      }
      confirmedText={
        <fbt desc="admin.settings.payments.disconnectSuccess">
          <FbtParam name="processorName">{processor.title}</FbtParam>{' '}
          disconnected
        </fbt>
      }
      onConfirm={() => {
        let updatedConfig = {}
        switch (processor.id) {
          case 'stripe':
            updatedConfig = {
              disconnectStripe: true,
              stripeKey: '',
              stripeBackend: '',
              stripeWebhookSecret: '',
              stripeWebhookHost: ''
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
              disconnectPrintful: true,
              printful: '',
              printfulAutoFulfill: false,
              shippingApi: false
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
              disconnectPaypal: true,
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
