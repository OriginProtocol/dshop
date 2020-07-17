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

import ProcessorsList from 'components/settings/ProcessorsList'

const PaymentSettings = () => {
  const { shopConfig, refetch } = useShopConfig()
  const [{ admin }, dispatch] = useStateValue()
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
        enabled: upholdEnabled,
        hide: admin.superuser ? false : true
      }
    ]
      .filter((processor) => !processor.hide)
      .map((processor) => ({
        // Add actions buttons
        ...processor,
        actions: (
          <>
            {processor.enabled ? (
              <>
                <button
                  className="btn btn-outline-primary mr-2"
                  type="button"
                  onClick={() => setShowConnectModal(processor.id)}
                  children="Configure"
                />
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
                children="Connect"
              />
            )}
          </>
        )
      }))
  }, [shopConfig])

  const actions = (
    <>
      <button type="button" className="btn btn-outline-primary">
        Cancel
      </button>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Updating...' : 'Update'}
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

        setSaving(true)

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

          dispatch({ type: 'toast', message: 'Saved OK' })
          setSaving(false)
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title">
        Settings
        <div className="actions">{actions}</div>
      </h3>
      <Tabs />
      <div className="admin-payment-settings shop-settings processors-list">
        <div className="processor web3">
          <div className="icon">
            <Icons.Web3 />
          </div>
          <div>
            <div className="title">Crypto Wallet</div>
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
        <ProcessorsList processors={Processors} />

        {connectModal === 'web3' && <Web3Modal onClose={onCloseModal} />}
        {connectModal === 'stripe' && (
          <StripeModal
            onClose={onCloseModal}
            initialConfig={{
              ...config,
              ...shopConfig
            }}
          />
        )}
        {connectModal === 'uphold' && <UpholdModal onClose={onCloseModal} />}

        <ContractSettings {...{ state, setState, config }} />
      </div>
      <div className="footer-actions">
        <div className="actions">{actions}</div>
      </div>
    </form>
  )
}

export default PaymentSettings

require('react-styl')(`
`)
