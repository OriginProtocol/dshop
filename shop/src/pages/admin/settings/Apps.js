import React, { useMemo, useState } from 'react'

import useShopConfig from 'utils/useShopConfig'
import Tabs from './_Tabs'
import PrintfulModal from './apps/PrintfulModal'
import PrintfulSync from './apps/PrintfulSync'
import DisconnectModal from './payments/_DisconnectModal'

const maskSecret = (secret) => {
  return `${secret
    .substr(0, secret.length - 4)
    .replace(/[^-]/g, 'x')}${secret.substr(-4)}`
}

const AppSettings = () => {
  const { shopConfig, refetch } = useShopConfig()

  const [connectModal, setShowConnectModal] = useState(false)

  const Processors = useMemo(() => {
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
      }
    ]
  }, [shopConfig])

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
      {connectModal === 'printful' && (
        <PrintfulModal
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
