import React, { useMemo, useState } from 'react'

import useShopConfig from 'utils/useShopConfig'
import useEmailAppsList from 'utils/useEmailAppsList'
import maskSecret from 'utils/maskSecret'

import Tabs from '../_Tabs'
import PrintfulModal from './PrintfulModal'
import PrintfulSync from './PrintfulSync'
import SendgridModal from './SendgridModal'
import AWSModal from './AWSModal'
import MailgunModal from './MailgunModal'
import DisconnectModal from '../payments/_DisconnectModal'

import ProcessorsList from 'components/settings/ProcessorsList'

const AppSettings = () => {
  const { shopConfig, refetch } = useShopConfig()

  const [connectModal, setShowConnectModal] = useState(false)

  const { emailAppsList } = useEmailAppsList({ shopConfig })

  const appsList = useMemo(() => {
    if (!shopConfig) return []

    const { printful } = shopConfig
    const printfulEnabled = !!printful

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
      ...emailAppsList
    ].map((processor) => ({
      // Add actions buttons
      ...processor,
      actions: (
        <>
          {processor.enabled ? (
            <>
              {processor.actions}
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() => setShowConnectModal(processor.id)}
              >
                Configure
              </button>
              <DisconnectModal
                processor={processor}
                afterDelete={() => refetch()}
              />
            </>
          ) : (
            <button
              className="btn btn-outline-primary px-4"
              type="button"
              onClick={() => setShowConnectModal(processor.id)}
            >
              Connect
            </button>
          )}
        </>
      )
    }))
  }, [shopConfig, emailAppsList])

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
      <ProcessorsList processors={appsList} />
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
