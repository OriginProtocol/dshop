import React, { useMemo, useState, useEffect } from 'react'
import get from 'lodash/get'
import pickBy from 'lodash/pickBy'

import useShopConfig from 'utils/useShopConfig'
import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import useListingData from 'utils/useListingData'
import { useStateValue } from 'data/state'

import * as Icons from 'components/icons/Admin'
import Tabs from '../_Tabs'
import Web3Modal from './Web3Modal'
import StripeModal from './StripeModal'
import UpholdModal from './UpholdModal'
import ContractSettings from './ContractSettings'
import DisconnectModal from './_DisconnectModal'
import CreateListing from './_CreateListing'

const PaymentSettings = () => {
  const { shopConfig, refetch } = useShopConfig()
  const [{ admin }] = useStateValue()
  const { config, refetch: refetchConfig } = useConfig()
  const [state, setState] = useSetState()
  const { listing } = useListingData(state.listingId)

  useEffect(() => {
    const { listingId, acceptedTokens } = config
    setState({ listingId, acceptedTokens })
  }, [config.activeShop])

  const [connectModal, setShowConnectModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { post } = useBackendApi({ authToken: true })

  const Processors = useMemo(() => {
    if (!shopConfig) return []

    const { stripeBackend, upholdApi, upholdClient, upholdSecret } = shopConfig
    const stripeEnabled = !!stripeBackend
    const upholdEnabled = !!upholdApi && !!upholdClient && !!upholdSecret

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
      }
    ]
  }, [shopConfig])

  const actions = (
    <>
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
    </>
  )

  function onCloseModal() {
    setShowConnectModal(null)
    refetch()
  }

  function onListingCreated(createdListing) {
    const listingId = [
      get(admin, 'network.networkId'),
      get(admin, 'network.marketplaceVersion'),
      createdListing
    ].join('-')
    post('/shop/config', {
      method: 'PUT',
      body: JSON.stringify({ listingId }),
      suppressError: true
    }).then(() => {
      refetch()
      refetchConfig()
    })
  }

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
        <div className="actions ml-auto">{actions}</div>
      </h3>
      <Tabs />
      <div className="admin-payment-settings shop-settings">
        <div className="processor web3">
          <div className="icon">
            <Icons.Web3 />
          </div>
          <div>
            <div className="title">Web3 Wallet</div>
            {config.listingId ? (
              <>
                <div className="description">
                  <div>{`Shop ID: ${config.listingId}`}</div>
                  {!listing ? null : (
                    <div className="mt-1">{`Account: ${listing.seller}`}</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="description">
                  You have not connected a wallet. This is where crypto payments
                  will be sent.
                </div>
                <div className="actions">
                  <CreateListing
                    className="btn btn-outline-primary px-4"
                    onCreated={onListingCreated}
                    children="Connect"
                  />
                </div>
              </>
            )}
          </div>
        </div>
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
                    onClick={() => setShowConnectModal(processor.id)}
                    children="Connect"
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {connectModal === 'web3' && <Web3Modal onClose={onCloseModal} />}
        {connectModal === 'stripe' && <StripeModal onClose={onCloseModal} />}
        {connectModal === 'uphold' && <UpholdModal onClose={onCloseModal} />}

        <ContractSettings {...{ state, setState, config }} />

        <div className="d-flex mt-4 justify-content-end">{actions}</div>
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
      &.printful .icon, &.sendgrid .icon, &.aws .icon, &.mailgun .icon
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
