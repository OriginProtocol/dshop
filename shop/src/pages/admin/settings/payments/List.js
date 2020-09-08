import React, { useMemo, useState, useEffect } from 'react'
import ethers from 'ethers'
import fbt, { FbtParam } from 'fbt'
import pickBy from 'lodash/pickBy'
import uniqBy from 'lodash/uniqBy'
//import get from 'lodash/get'

import useShopConfig from 'utils/useShopConfig'
import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import DefaultTokens from 'data/defaultTokens'
import { useStateValue } from 'data/state'

import * as Icons from 'components/icons/Admin'
import Link from 'components/Link'
import Web3Modal from './Web3Modal'
import StripeModal from './StripeModal'
import UpholdModal from './UpholdModal'
import PayPalModal from './PayPalModal'
import CryptoSettings from './CryptoSettings'
import OfflinePayments from './OfflinePayments'
import DisconnectModal from './_DisconnectModal'

import ProcessorsList from 'components/settings/ProcessorsList'

const validate = (state) => {
  const newState = {}

  if (!state.disableCryptoPayments) {
    if (!state.walletAddress) {
      newState.walletAddressError = fbt(
        'Wallet address is required',
        'admin.settings.payments.List.walletAddressRequired'
      )
    } else if (!ethers.utils.isAddress(state.walletAddress)) {
      newState.walletAddressError = fbt(
        'Invalid wallet address',
        'admin.settings.payments.List.invalidWalletAddressError'
      )
    }
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState
    }
  }
}

const PaymentSettings = () => {
  const { shopConfig, refetch } = useShopConfig()
  const [{ admin }, dispatch] = useStateValue()
  const { config, refetch: refetchConfig } = useConfig()
  const [state, setState] = useSetState()

  useEffect(() => {
    const {
      listingId,
      currency,
      offlinePaymentMethods,
      disableCryptoPayments,
      walletAddress
    } = config
    const acceptedTokens = config.acceptedTokens || []
    const configCustomTokens = config.customTokens || []
    const customTokens = uniqBy(
      [...acceptedTokens, ...configCustomTokens],
      'id'
    ).filter((t) => !DefaultTokens.map((t) => t.id).includes(t.id))
    setState({
      acceptedTokens,
      customTokens,
      listingId,
      useEscrow: config.useEscrow ? true : false, // By default, do not use the marketplace contract for crypto payments.
      currency: currency || 'USD',
      offlinePaymentMethods,
      disableCryptoPayments,
      walletAddress
    })
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
      paypal
    } = shopConfig
    const stripeEnabled = !!stripeBackend
    const upholdEnabled = !!upholdApi && !!upholdClient && !!upholdSecret

    return [
      {
        id: 'stripe',
        title: 'Stripe',
        description: stripeEnabled ? (
          <fbt desc="admin.settings.payments.stripeEnabledDesc">
            Your Stripe account has been connected
          </fbt>
        ) : (
          <fbt desc="admin.settings.payments.stripeDisabledDesc">
            Use Stripe to easily accept Visa, MasterCard, American Express and
            almost any other kind of credit or debit card in your shop.
          </fbt>
        ),
        icon: <Icons.Stripe />,
        enabled: stripeEnabled
      },
      {
        id: 'paypal',
        title: 'PayPal',
        description: paypal ? (
          <fbt desc="admin.settings.payments.paypalEnabledDesc">
            Your PayPal account has been connected
          </fbt>
        ) : (
          <fbt desc="admin.settings.payments.paypalDisabledDesc">
            Use PayPal to easily accept Visa, MasterCard, American Express and
            almost any other kind of credit or debit card in your shop.
          </fbt>
        ),
        icon: <Icons.PayPal />,
        enabled: paypal
      },
      {
        id: 'uphold',
        title: 'Uphold',
        description: upholdEnabled ? (
          <fbt desc="admin.settings.payments.upholdEnabledDesc">
            Environment: <FbtParam name="environment">{upholdApi}</FbtParam>
          </fbt>
        ) : (
          <fbt desc="admin.settings.payments.upholdDisabledDesc">
            Use Uphold to easily accept crypto payments in your shop.
          </fbt>
        ),
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
                  children={<fbt desc="Configure">Configure</fbt>}
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
                children={<fbt desc="Connect">Connect</fbt>}
              />
            )}
          </>
        )
      }))
  }, [shopConfig])

  const actions = (
    <>
      <button type="button" className="btn btn-outline-primary">
        <fbt desc="Cancel">Cancel</fbt>
      </button>
      <button
        type="submit"
        className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
        disabled={saving}
        children={
          saving ? (
            <>
              <fbt desc="Updating">Updating</fbt>...
            </>
          ) : (
            <fbt desc="Update">Update</fbt>
          )
        }
      />
    </>
  )

  function onCloseModal() {
    setShowConnectModal(null)
    refetch()
    refetchConfig()
  }

  //const sellerWallet = get(shopConfig, 'walletAddress')

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()
        if (saving) return

        const { valid, newState } = validate(state)
        setState(newState)
        if (!valid) return

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
          dispatch({
            type: 'setConfigSimple',
            config: { ...config, ...shopConfig }
          })
          setState({ hasChanges: false })
          setSaving(false)
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="Payments">Payments</fbt>
        <div className="actions">{actions}</div>
      </h3>
      <div className="shop-settings processors-list">
        <h4>
          <fbt desc="Integrations">Integrations</fbt>
        </h4>
        {/*
        // Disabling listing creation as part of turnin-on off-chain payment for all merchants.
        <div className="processor web3">
          <div className="icon">
            <Icons.Web3 />
          </div>
          <div>
            <div className="title">
              <fbt desc="CryptoWallet">Crypto Wallet</fbt>
            </div>
            {config.listingId ? (
              <>
                <div className="description">
                  <div>
                    <fbt desc="admin.settings.payments.shopId">
                      Shop ID:{' '}
                      <FbtParam name="listingId">{config.listingId}</FbtParam>
                    </fbt>
                  </div>
                  <div className="mt-1">
                    <fbt desc="admin.settings.payments.account">
                      Account:{' '}
                      <FbtParam name="sellerWallet">{sellerWallet}</FbtParam>
                    </fbt>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="description">
                  {sellerWallet ? (
                    <fbt desc="admin.settings.payments.pendingListingCreation">
                      Your listing is pending creation using account{' '}
                      <FbtParam name="sellerWallet">{sellerWallet}</FbtParam>
                    </fbt>
                  ) : (
                    <fbt desc="admin.settings.payments.walletNotConnected">
                      You have not connected a wallet. This is where crypto
                      payments will be sent.
                    </fbt>
                  )}
                </div>
                <div className="actions">
                  <CreateListing
                    className="btn btn-outline-primary px-4"
                    onCreated={() => {
                      refetch()
                      refetchConfig()
                    }}
                    children={
                      sellerWallet ? (
                        <fbt desc="Re-Connect">Re-Connect</fbt>
                      ) : (
                        <fbt desc="Connect">Connect</fbt>
                      )
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
    */}
        <ProcessorsList processors={Processors} />

        {connectModal === 'web3' && <Web3Modal onClose={onCloseModal} />}
        {connectModal === 'stripe' && (
          <StripeModal
            onClose={onCloseModal}
            initialConfig={{ ...config, ...shopConfig }}
          />
        )}
        {connectModal === 'uphold' && (
          <UpholdModal
            initialConfig={{ ...config, ...shopConfig }}
            onClose={onCloseModal}
          />
        )}
        {connectModal === 'paypal' && (
          <PayPalModal
            onClose={onCloseModal}
            initialConfig={{ ...config, ...shopConfig }}
          />
        )}

        <OfflinePayments
          onChange={setState}
          offlinePaymentMethods={state.offlinePaymentMethods}
        />

        <CryptoSettings {...{ state, setState, config }} />
      </div>
      <div className="footer-actions">
        <div className="actions">{actions}</div>
      </div>
    </form>
  )
}

export default PaymentSettings
