import React, { useMemo, useState } from 'react'

import useShopConfig from 'utils/useShopConfig'
import Tabs from './_Tabs'
import PrintfulModal from './apps/PrintfulModal'
import PrintfulSync from './apps/PrintfulSync'
import SendgridModal from './apps/SendgridModal'
import AWSModal from './apps/AWSModal'
import MailgunModal from './apps/MailgunModal'
import DisconnectModal from './payments/_DisconnectModal'

const maskSecret = (secret, maxLen) => {
  const shouldTruncate = maxLen && secret.length > maxLen

  return `${secret
    .substr(
      0,
      shouldTruncate
        ? Math.min(maxLen / 2, secret.length - 4)
        : secret.length - 4
    )
    .replace(/[^-]/g, 'x')}${shouldTruncate ? '...' : ''}${secret.substr(
    shouldTruncate ? -(maxLen / 2) : -4
  )}`
}

const AppSettings = () => {
  const { shopConfig, refetch } = useShopConfig()

  const [connectModal, setShowConnectModal] = useState(false)

  const Processors = useMemo(() => {
    if (!shopConfig) return []

    const {
      email,
      printful,
      sendgridApiKey,
      sendgridUsername,
      awsAccessKey,
      mailgunSmtpLogin,
      mailgunSmtpServer
    } = shopConfig
    const printfulEnabled = !!printful

    const sendgridEnabled = email === 'sendgrid'
    const awsEnabled = email === 'aws'
    const mailgunEnabled = email === 'mailgun'

    return [
      {
        id: 'printful',
        title: 'Printful',
        description: printfulEnabled
          ? `Printful API key: ${maskSecret(printful)}`
          : 'Import your products from Printful.',
        icon: <img src="images/printful.svg" width="70%" />,
        enabled: printfulEnabled,
        actions: <PrintfulSync className="mr-2" />
      },
      {
        id: 'sendgrid',
        title: 'Sendgrid',
        description: sendgridEnabled
          ? `Sendgrid ${sendgridApiKey ? 'API key' : 'username'}: ${
              sendgridApiKey ? maskSecret(sendgridApiKey, 12) : sendgridUsername
            }`
          : 'Send emails using SendGrid',
        icon: <img src="images/sendgrid.png" width="100%" />,
        enabled: sendgridEnabled
      },
      {
        id: 'aws',
        title: 'AWS SES',
        description: awsEnabled
          ? `AWS SES Access Key: ${maskSecret(awsAccessKey, 12)}`
          : 'Send emails using AWS SES',
        icon: <img src="images/aws-ses.png" width="60%" />,
        enabled: awsEnabled
      },
      {
        id: 'mailgun',
        title: 'Mailgun',
        description: mailgunEnabled
          ? `Mailgun account: ${mailgunSmtpLogin}@${mailgunSmtpServer}`
          : 'Send emails using Mailgun',
        icon: <img src="images/mailgun.png" width="80%" />,
        enabled: mailgunEnabled
      }
    ]
  }, [shopConfig])

  let ModalToRender

  switch (connectModal) {
    case 'printful':
      ModalToRender = PrintfulModal
      break
    case 'sendgrid':
      ModalToRender = SendgridModal
      break
    case 'aws':
      ModalToRender = AWSModal
      break
    case 'mailgun':
      ModalToRender = MailgunModal
      break
  }

  return (
    <>
      <h3 className="admin-title">Settings</h3>
      <Tabs />
      <div className="admin-payment-settings">
        {Processors.map((processor) => (
          <div key={processor.id} className={`processor ${processor.id}`}>
            <div className="icon">{processor.icon}</div>
            <div>
              <div className="title">{processor.title}</div>
              <div className="description">
                {processor.description}
                {!processor.enabled ? null : (
                  <div className="connected-text">Connected</div>
                )}
              </div>
              <div className="actions">
                {processor.enabled ? (
                  <>
                    {processor.actions}
                    <DisconnectModal
                      processor={processor}
                      afterDelete={() => refetch()}
                    />
                  </>
                ) : (
                  <button
                    className="btn btn-outline-primary px-4"
                    type="button"
                    onClick={() => {
                      setShowConnectModal(processor.id)
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!connectModal ? null : (
        <ModalToRender
          initialConfig={shopConfig}
          onClose={() => {
            setShowConnectModal(null)
            refetch()
          }}
        />
      )}
    </>
  )
}

export default AppSettings

require('react-styl')(`
`)
