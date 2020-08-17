import React, { useMemo, useState, useEffect } from 'react'
import fbt from 'fbt'
import pickBy from 'lodash/pickBy'
import uniqBy from 'lodash/uniqBy'
import get from 'lodash/get'

import { AllCurrencies } from 'data/Currencies'
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
import ContractSettings from './ContractSettings'
import OfflinePayments from './OfflinePayments'
import DisconnectModal from './_DisconnectModal'
import CreateListing from './_CreateListing'

import ProcessorsList from 'components/settings/ProcessorsList'

const PaymentSettings = () => {
  const { shopConfig, refetch } = useShopConfig()
  const [{ admin }, dispatch] = useStateValue()
  const { config, refetch: refetchConfig } = useConfig()
  const [state, setState] = useSetState()

  useEffect(() => {
    const { listingId, currency, offlinePaymentMethods } = config
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
      currency: currency || 'USD',
      offlinePaymentMethods
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
        description: stripeEnabled
          ? 'Your Stripe account has been connected'
          : 'Use Stripe to easily accept Visa, MasterCard, American Express and almost any other kind of credit or debit card in your shop.',
        icon: <Icons.Stripe />,
        enabled: stripeEnabled
      },
      {
        id: 'paypal',
        title: 'PayPal',
        description: paypal
          ? 'Your PayPal account has been connected'
          : 'Use PayPal to easily accept Visa, MasterCard, American Express and almost any other kind of credit or debit card in your shop.',
        icon: <Icons.PayPal />,
        enabled: paypal
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
      <button
        type="submit"
        className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
        disabled={saving}
        children={saving ? 'Updating...' : 'Update'}
      />
    </>
  )

  function onCloseModal() {
    setShowConnectModal(null)
    refetch()
    refetchConfig()
  }

  const sellerWallet = get(shopConfig, 'walletAddress')

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
        Payments
        <div className="actions">{actions}</div>
      </h3>
      <div className="shop-settings processors-list">
        <div className="select-currency">
          <h4>Store currency</h4>
          <div>
            <div className="description">
              You should review any potential legal and tax considerations
              involved with selling in a currency that is different from the one
              associated with the country your store is located in.
            </div>
            <select
              className="form-control"
              value={state.currency}
              onChange={(e) => setState({ currency: e.target.value })}
            >
              {AllCurrencies.map((currency) => (
                <option key={currency[0]} value={currency[0]}>
                  {currency[1]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h4>Integrations</h4>
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
                  <div className="mt-1">{`Account: ${sellerWallet}`}</div>
                </div>
              </>
            ) : (
              <>
                <div className="description">
                  {sellerWallet
                    ? `Your listing is pending creation using account ${sellerWallet}`
                    : `You have not connected a wallet. This is where crypto payments will be sent.`}
                </div>
                <div className="actions">
                  <CreateListing
                    className="btn btn-outline-primary px-4"
                    onCreated={() => {
                      refetch()
                      refetchConfig()
                    }}
                    children={sellerWallet ? 'Re-Connect' : 'Connect'}
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
  .shop-settings
    .select-currency
      margin-top: 1.5rem
      padding-bottom: 2.5rem
      border-bottom: 1px solid #cdd7e0
      margin-bottom: 2rem
      line-height: normal
      > div
        color: #8293a4
        max-width: 530px
        .description
          font-size: 14px
          margin-bottom: 1rem
`)
