import React, { useEffect } from 'react'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import { useStateValue } from 'data/state'
import { Countries } from '@origin/utils/Countries'
import formatPrice from 'utils/formatPrice'
import useFlattenedShippingZones from 'utils/useFlattenedShippingZones'
import useConfig from 'utils/useConfig'
import Link from 'components/Link'
import Contact from './_Contact'
import ShipTo from './_ShipTo'
import BetaWarning from './_BetaWarning'
import useCurrencyOpts from 'utils/useCurrencyOpts'
import { ethers } from 'ethers'

function isActive(zone, cart) {
  return get(cart, 'shipping.id') === zone.id ? 'active' : 'inactive'
}

const CheckoutShipping = () => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()
  const {
    shippingZones,
    loading,
    error: shippingZonesError
  } = useFlattenedShippingZones()
  const currencyOpts = useCurrencyOpts()

  const country = get(cart, 'userInfo.country')
  const countryCode = get(Countries, `${country}.code`)
  const defaultShippingZones = shippingZones.filter(
    (zone) => !get(zone, 'countries.length', 0)
  ) // Refers to the 'Rest of the World' shipping options, if set.
  const filteredShippingZones = shippingZones.filter(
    (zone) => (zone.countries || []).indexOf(countryCode) >= 0
  )
  if (
    !shippingZonesError &&
    !filteredShippingZones.length &&
    defaultShippingZones.length
  ) {
    filteredShippingZones.push(...defaultShippingZones)
  }

  const unshippableItems = cart.items.filter((item) => {
    const restrictTo = get(item, 'restrictShippingTo', [])
    if (!restrictTo.length) {
      return false
    }
    return restrictTo.indexOf(countryCode) < 0
  })

  useEffect(() => {
    const selected = get(cart, 'shipping.id')
    const hasSelected = filteredShippingZones.find((z) => z.id === selected)
    if (!cart.shipping || !hasSelected) {
      const zone = filteredShippingZones[0]
      if (zone) {
        dispatch({ type: 'updateShipping', zone })
      }
    }
  }, [shippingZones.length])

  const hasNFTs = cart.items.some((i) => i.nft)
  const notShippable = !filteredShippingZones.length
  const wallet = get(cart, 'userInfo.wallet', '')
  const walletInvalid = hasNFTs && !ethers.utils.isAddress(wallet)
  const disabled = unshippableItems.length || notShippable || walletInvalid

  return (
    <div className="checkout-shipping">
      <div className="d-none d-md-block">
        <h3>{config.fullTitle}</h3>
        <div className="breadcrumbs">
          <Link to="/cart">
            <fbt desc="Cart">Cart</fbt>
          </Link>
          <Link to="/checkout">
            <fbt desc="Information">Information</fbt>
          </Link>
          <span>
            <b>
              <fbt desc="Shipping">Shipping</fbt>
            </b>
          </span>
          <span>
            <fbt desc="Payment">Payment</fbt>
          </span>
        </div>
      </div>
      <div className="checkout-review-info">
        <Contact />
        <ShipTo />
      </div>
      <div className="mt-4 mb-3">
        <b>
          <fbt desc="ShippingMethod">Shipping Method</fbt>
        </b>
      </div>
      <div className="checkout-payment-method">
        {unshippableItems.length ? (
          <div className="p-3">
            <fbt desc="checkout.shipping.unshippableItems">
              Sorry, these items cannot be shipped to{' '}
              <FbtParam name="country">{country}</FbtParam>:
            </fbt>
            <ul className="mt-2">
              {unshippableItems.map((item, idx) => (
                <li key={idx}>{item.title}</li>
              ))}
            </ul>
          </div>
        ) : loading ? (
          <div className="p-3">
            <fbt desc="checkout.shipping.loadingCosts">
              Loading shipping costs...
            </fbt>
          </div>
        ) : shippingZonesError || !filteredShippingZones.length ? (
          <div className="p-3">
            <fbt desc="checkout.shipping.loadError">
              Sorry, there was an error calculating shipping costs. Try
              refreshing the page.
            </fbt>
          </div>
        ) : (
          filteredShippingZones.map((zone) => (
            <label key={zone.id} className={`radio ${isActive(zone, cart)}`}>
              <input
                type="radio"
                name="shippingMethod"
                checked={get(cart, 'shipping.id') === zone.id}
                onChange={() => dispatch({ type: 'updateShipping', zone })}
              />
              <div>
                <div>{zone.label}</div>
                <div className="description">{zone.detail}</div>
              </div>
              <span className="ml-auto">
                {zone.amount ? (
                  formatPrice(zone.amount, currencyOpts)
                ) : (
                  <fbt desc="Free">Free</fbt>
                )}
              </span>
            </label>
          ))
        )}
      </div>
      {!hasNFTs ? null : (
        <>
          <div className="mt-4 mb-2">
            <b>
              <fbt desc="checkout.shipping.nftDelivery">NFT delivery</fbt>
            </b>
          </div>
          <div className="input-group">
            <input
              className="form-control"
              type="text"
              value={get(cart, 'userInfo.wallet', '')}
              onChange={(e) => {
                dispatch({ type: 'setWallet', wallet: e.target.value })
              }}
              placeholder="Enter Ethereum wallet address..."
            />
            {!window.ethereum ? null : (
              <div className="input-group-append">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={async () => {
                    const [wallet] = await window.ethereum.enable()
                    if (wallet) {
                      dispatch({ type: 'setWallet', wallet })
                    }
                  }}
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
          <div className="small mt-2 text-muted">
            <b>Note:</b> NFT will be delivered within 24 hours
          </div>
        </>
      )}
      <div className="actions">
        <Link to="/checkout">
          &laquo;{' '}
          <fbt desc="checkout.shipping.goback">Return to information</fbt>
        </Link>
        {disabled ? (
          <button className="btn btn-primary btn-lg disabled">
            <fbt desc="checkout.shipping.goToPayment">Continue to payment</fbt>
          </button>
        ) : (
          <Link to="/checkout/payment" className="btn btn-primary btn-lg">
            <fbt desc="checkout.shipping.goToPayment">Continue to payment</fbt>
          </Link>
        )}
      </div>

      <BetaWarning />
    </div>
  )
}

export default CheckoutShipping

require('react-styl')(`
  .checkout-review-info
    border: 1px solid #eee
    border-radius: 0.5rem
    padding: 0 1rem
    .info-row
      display: flex
      justify-content: space-between
      border-bottom: 1px solid #eee
      padding: 1rem 0
      align-items: center
      &:last-of-type
        border: 0
      .label
        color: #666
        width: 100px
      .value
        flex: 1
      .change
        text-align: right
        font-size: 0.75rem
      a
        color: #1990c6
  @media (max-width: 767.98px)
    .checkout-review-info
      .info-row
        flex-wrap: wrap
        .label
          width: 70%
        .value
          width: 100%
          order: 3
        .change
          width: 30%
`)
