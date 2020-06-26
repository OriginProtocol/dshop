import React, { useMemo, useState, useEffect } from 'react'
import ethers from 'ethers'
import pickBy from 'lodash/pickBy'

import useShopConfig from 'utils/useShopConfig'
import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'

import * as Icons from 'components/icons/Admin'
import Tabs from './_Tabs'
import Web3Modal from './payments/Web3Modal'
import StripeModal from './payments/StripeModal'
import UpholdModal from './payments/UpholdModal'
import ContractSettings from './payments/ContractSettings'
import DisconnectModal from './payments/_DisconnectModal'

const PaymentSettings = () => {
  const { shopConfig, refetch } = useShopConfig()
  const { config } = useConfig()
  const [state, setState] = useSetState()

  useEffect(() => {
    setState({ listingId: config.listingId })
  }, [config.activeShop])

  const [connectModal, setShowConnectModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { post } = useBackendApi({ authToken: true })

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
        enabled: stripeEnabled
      },
      {
        id: 'uphold',
        title: 'Uphold',
        description: upholdEnabled
          ? `Environment: ${upholdApi}`
          : 'Use Uphold to easily accept crypto payments in your shop.',
        icon: <Icons.Uphold />,
        enabled: upholdEnabled
      },
      {
        id: 'web3',
        title: 'Web3 Wallet',
        description: web3Enabled
          ? `Address: ${walletAddress}`
          : 'You have not connected a wallet',
        icon: <Icons.Web3 />,
        enabled: web3Enabled
      }
    ]
  }, [shopConfig])

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()
        if (saving) return

        setSaving('saving')

        try {
          const shopConfig = pickBy(state, (v, k) => !k.endsWith('Error'))
          const shopConfigRes = await post('/shop/config', {
            method: 'PUT',
            body: JSON.stringify(shopConfig),
            suppressError: true
          })

          if (!shopConfigRes.success && shopConfigRes.field) {
            setState({ [`${shopConfigRes.field}Error`]: shopConfigRes.reason })
            setSaving(false)
            return
          }

          setSaving('ok')
          setTimeout(() => setSaving(null), 3000)
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title">
        Settings
        <div className="actions ml-auto">
          <button type="button" className="btn btn-outline-primary mr-2">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving === 'saving'
              ? 'Updating...'
              : saving === 'ok'
              ? 'Updated ✅'
              : 'Update'}
          </button>
        </div>
      </h3>
      <Tabs />
      <div className="admin-payment-settings shop-settings">
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
                {processor.enabled ? (
                  <DisconnectModal
                    processor={processor}
                    afterDelete={() => refetch()}
                  />
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
        {connectModal === 'web3' && (
          <Web3Modal
            onClose={() => {
              setShowConnectModal(null)
              refetch()
            }}
          />
        )}
        {connectModal === 'stripe' && (
          <StripeModal
            onClose={() => {
              setShowConnectModal(null)
              refetch()
            }}
          />
        )}
        {connectModal === 'uphold' && (
          <UpholdModal
            onClose={() => {
              setShowConnectModal(null)
              refetch()
            }}
          />
        )}
        <ContractSettings {...{ state, setState, config }} />
      </div>
    </form>
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
      &.printful .icon
        border: 1px solid #cdd7e0

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
