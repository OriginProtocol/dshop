import React, { useMemo, useState } from 'react'

import ethers from 'ethers'

import useBackendApi from 'utils/useBackendApi'
import useShopConfig from 'utils/useShopConfig'
import * as Icons from 'components/icons/Admin'
import Tabs from './_Tabs'
import Web3Modal from './payments/Web3Modal'
import StripeModal from './payments/StripeModal'
import UpholdModal from './payments/UpholdModal'

const maskSecret = (secret) => {
  // Mask everything other than last 4 characters
  return (secret || '').replace(/^.*.{4}$/gi, 'x')
}

const PaymentSettings = () => {
  const { shopConfig, refetch } = useShopConfig()

  const [activeModal, setActiveModal] = useState()

  const { post } = useBackendApi({ authToken: true })

  const updateConfig = async (body) => {
    try {
      await post('/config', {
        method: 'POST',
        body: JSON.stringify(body)
      })
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const Processors = useMemo(() => {
    if (!shopConfig) return []

    const {
      stripeBackend,
      upholdApi,
      upholdClient,
      upholdSecret,
      web3Pk
    } = shopConfig
    const stripeEnabled = !!stripeBackend
    const upholdEnabled = !!upholdApi && !!upholdClient && !!upholdSecret
    const web3Enabled = !!web3Pk

    let walletAddress = ''

    if (web3Enabled) {
      try {
        const wallet = new ethers.Wallet(web3Pk)
        walletAddress = wallet.address
      } catch (err) {
        console.error(err)
      }
    }

    return [
      {
        id: 'stripe',
        title: 'Stripe',
        description: stripeEnabled
          ? 'Your stripe account has been connected'
          : 'Use Stripe to easily accept Visa, MasterCard, American Express and almost any other kind of credit or debit card in your shop.',
        icon: <Icons.Stripe />,
        enabled: stripeEnabled,
        disconnect: () =>
          updateConfig({
            stripeBackend: ''
          })
      },
      {
        id: 'uphold',
        title: 'Uphold',
        description: upholdEnabled
          ? `Environment: ${upholdApi}`
          : 'Use Uphold to easily accept crypto payments in your shop.',
        icon: <Icons.Uphold />,
        enabled: upholdEnabled,
        disconnect: () =>
          updateConfig({
            upholdApi: '',
            upholdClient: '',
            upholdSecret: ''
          })
      },
      {
        id: 'web3',
        title: 'Web3 Wallet',
        description: web3Enabled
          ? `Address: ${walletAddress}`
          : 'You have not connected a wallet',
        icon: <Icons.Web3 />,
        enabled: web3Enabled,
        disconnect: () =>
          updateConfig({
            web3Pk: ''
          })
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
                  <div className="connected-text">
                    {processor.id === 'web3' ? 'Wallet Connected' : 'Connected'}
                  </div>
                )}
              </div>
              <div className="actions">
                <button
                  className="btn btn-outline-primary px-4"
                  type="button"
                  onClick={() => {
                    if (processor.enabled) {
                      processor.disconnect()
                    } else {
                      setActiveModal(processor.id)
                    }
                  }}
                >
                  {processor.enabled ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {activeModal === 'web3' && (
        <Web3Modal
          onClose={() => {
            setActiveModal(null)
            refetch()
          }}
        />
      )}
      {activeModal === 'stripe' && (
        <StripeModal
          onClose={() => {
            setActiveModal(null)
            refetch()
          }}
        />
      )}
      {activeModal === 'uphold' && (
        <UpholdModal
          onClose={() => {
            setActiveModal(null)
            refetch()
          }}
        />
      )}
    </>
  )
}

export default PaymentSettings

require('react-styl')(`
  .admin-payment-settings
    .processor
      margin-top: 2rem
      display: flex
      .icon
        display: flex
        align-items: center
        justify-content: center
        width: 115px
        height: 115px
        border-radius: 10px
        margin-right: 1.5rem
      &.stripe .icon
        background-color: #6772e5
      &.uphold .icon
        background-color: #00cc58
      &.web3 .icon
        background-color: #3b80ee
      > div:nth-child(2)
        display: flex
        flex-direction: column
        line-height: normal
        .title
          font-weight: bold
        .description
          max-width: 30rem
          flex: 1
          margin: 0.5rem 0
          .connected-text
            margin-top: 0.5rem
            display: flex
            align-items: center
            &:before
              content: ' '
              width: 14px
              height: 14px
              background-color: #3beec3
              border-radius: 50%
              display: inline-block
              margin-right: 6px
        .actions
          margin-top: 0.25rem
`)
