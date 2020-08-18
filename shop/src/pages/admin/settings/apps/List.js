import React, { useMemo, useState } from 'react'
import fbt, { FbtParam } from 'fbt'

import useShopConfig from 'utils/useShopConfig'
import useEmailAppsList from 'utils/useEmailAppsList'
import maskSecret from 'utils/maskSecret'

import Link from 'components/Link'
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
        description: printfulEnabled ? (
          <fbt desc="__printfulEnabledDesc">
            Printful API key:{' '}
            <FbtParam name="maskedSecret">{maskSecret(printful)}</FbtParam>
          </fbt>
        ) : (
          fbt('Import your products from Printful.', '__printfulDisabledDesc')
        ),
        icon: <img src="images/printful.svg" width="70%" />,
        enabled: printfulEnabled,
        actions: <PrintfulSync className="mr-2" />
      },
      ...emailAppsList
    ]
      .filter((processor) => !processor.hide)
      .map((processor) => ({
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
                  <fbt desc="Configure">Configure</fbt>
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
                <fbt desc="Connect">Connect</fbt>
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
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="Apps">Apps</fbt>
      </h3>
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
