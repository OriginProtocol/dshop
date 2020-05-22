import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import ethers from 'ethers'

import useConfig from 'utils/useConfig'
import usePrice from 'utils/usePrice'
import useMakeOffer from 'utils/useMakeOffer'
import useToken from 'utils/useToken'
import useWallet from 'utils/useWallet'
import useOrigin from 'utils/useOrigin'
import { useStateValue } from 'data/state'

const DefaultTokens = [
  { id: 'token-OGN', name: 'OGN' },
  { id: 'token-DAI', name: 'DAI' },
  { id: 'token-ETH', name: 'ETH' },
]

const PayWithCrypto = ({ submit, encryptedData, onChange, buttonText }) => {
  const { config } = useConfig()
  const { ogn, marketplace } = useOrigin()
  const [{ cart }, dispatch] = useStateValue()
  const [activeToken, setActiveToken] = useState({})
  const token = useToken(activeToken)
  const { exchangeRates, toTokenPrice } = usePrice()
  const [approveUnlockTx, setApproveUnlockTx] = useState(false)
  const [unlockTx, setUnlockTx] = useState(false)
  const wallet = useWallet()

  useMakeOffer({ submit, activeToken, encryptedData, onChange, buttonText })

  const paymentMethods = get(config, 'paymentMethods', [])
  const cryptoSelected = get(cart, 'paymentMethod.id') === 'crypto'
  const cryptoPaymentMethod = paymentMethods.find((o) => o.id === 'crypto')
  if (!cryptoPaymentMethod) {
    return null
  }

  const acceptedTokens = config.acceptedTokens || DefaultTokens

  useEffect(() => {
    const newState = {
      disabled:
        wallet.status !== 'enabled' ||
        !activeToken.id ||
        !token.hasBalance ||
        !token.hasAllowance ||
        token.loading,
    }
    if (activeToken.id) {
      newState.buttonText = `Pay ${toTokenPrice(
        cart.total,
        activeToken.name
      )} ${activeToken.name}`
    }
    onChange(newState)
  }, [activeToken.id, token.loading])

  const label = (
    <label className={`radio${cryptoSelected ? '' : ' inactive'}`}>
      <input
        type="radio"
        name="paymentMethod"
        checked={cryptoSelected}
        onChange={() => {
          dispatch({
            type: 'updatePaymentMethod',
            method: cryptoPaymentMethod,
          })
        }}
      />
      Crypto Currency
    </label>
  )

  if (!cryptoSelected) {
    return label
  } else if (wallet.status === 'loading') {
    return (
      <>
        {label}
        <div className="mt-2">Loading Wallet Status...</div>
      </>
    )
  } else if (wallet.status === 'disabled') {
    return (
      <>
        {label}
        <div className="mt-2">
          <button className="btn btn-primary" onClick={() => wallet.enable()}>
            Enable Crypto Wallet
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {label}
      {!cryptoSelected ? null : (
        <div className="pay-with-crypto pl-4 pt-2">
          <div className="tokens">
            {acceptedTokens.map((token) => (
              <div
                key={token.id}
                className={activeToken.id === token.id ? 'active' : ''}
                onClick={() => setActiveToken(token)}
              >
                <div>{`Pay with ${token.name}`}</div>
                <div>{`${toTokenPrice(cart.total, token.name)} ${
                  token.name
                }`}</div>
                <div className="sm">{`1 ${token.name} = $${(
                  1 / exchangeRates[token.name]
                ).toFixed(2)}`}</div>
              </div>
            ))}
          </div>
          {!activeToken.id || token.loading ? null : !token.hasBalance ? (
            <div className="alert alert-danger mt-3 mb-0">
              Insufficient balance
            </div>
          ) : !token.hasAllowance ? (
            <div className="alert alert-info mt-3 mb-0 d-flex align-items-center">
              {`Please unlock your ${activeToken.name} to continue`}
              <button
                className={`btn btn-primary btn-sm ml-3${
                  approveUnlockTx || unlockTx ? ' disabled' : ''
                }`}
                onClick={async () => {
                  if (approveUnlockTx || unlockTx) {
                    return false
                  }
                  const amount = toTokenPrice(cart.total, activeToken.name)
                  const amountWei = ethers.utils.parseUnits(amount, 'ether')
                  setApproveUnlockTx(true)
                  ogn
                    .approve(marketplace.address, amountWei)
                    .then((tx) => {
                      setUnlockTx(true)
                      setApproveUnlockTx(false)
                      return tx.wait()
                    })
                    .then(() => {
                      token.refetchBalance()
                      setUnlockTx(false)
                    })
                    .catch((err) => {
                      setUnlockTx(false)
                      setApproveUnlockTx(false)
                      console.log(err)
                    })
                }}
              >
                {unlockTx
                  ? 'Waiting'
                  : approveUnlockTx
                  ? 'Awaiting approval...'
                  : 'Unlock'}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </>
  )
}

export default PayWithCrypto

require('react-styl')(`
  .pay-with-crypto
    .tokens
      display: flex
      > div
        border: 1px solid #eee
        padding: 1rem
        border-radius: 0.5rem
        margin-right: 1rem
        cursor: pointer
        text-align: center
        opacity: 0.75
        &:hover
          opacity: 1
        &.active
          opacity: 1
          border-color: #007bff
        .sm
          font-size: 0.75rem
          margin-top: 0.25rem

  @media (max-width: 767.98px)
    .pay-with-crypto
      .tokens
        flex-direction: column
        > div:not(:last-child)
          margin-bottom: 1rem
`)
