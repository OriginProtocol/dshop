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

const PayWithCrypto = ({ submit, encryptedData, onChange, buttonText }) => {
  const { config } = useConfig()
  const { marketplace } = useOrigin()
  const [{ cart }, dispatch] = useStateValue()
  const [activeToken, setActiveToken] = useState({})
  const token = useToken(activeToken, cart.total)
  const { exchangeRates, toTokenPrice } = usePrice()
  const [approveUnlockTx, setApproveUnlockTx] = useState(false)
  const [unlockTx, setUnlockTx] = useState(false)
  const wallet = useWallet({ needSigner: true })

  useMakeOffer({ submit, activeToken, encryptedData, onChange, buttonText })

  const paymentMethods = get(config, 'paymentMethods', [])
  const cryptoSelected = get(cart, 'paymentMethod.id') === 'crypto'
  const cryptoPaymentMethod = paymentMethods.find((o) => o.id === 'crypto')
  if (!cryptoPaymentMethod) {
    return null
  }

  const acceptedTokens = config.acceptedTokens

  useEffect(() => {
    const newState = {
      disabled:
        wallet.status !== 'enabled' ||
        !activeToken.id ||
        !token.hasBalance ||
        !token.hasAllowance ||
        token.loading
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
            method: cryptoPaymentMethod
          })
        }}
      />
      Cryptocurrency
    </label>
  )

  if (!cryptoSelected) {
    return label
  } else if (wallet.status === 'loading') {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          Loading Wallet Status...
        </div>
      </>
    )
  } else if (
    wallet.status === 'disabled' ||
    wallet.signerStatus === 'disabled'
  ) {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          <button className="btn btn-primary" onClick={() => wallet.enable()}>
            Enable Crypto Wallet
          </button>
        </div>
      </>
    )
  } else if (wallet.status === 'no-web3') {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          Sorry, no crypto wallet detected.
        </div>
      </>
    )
  } else if (!wallet.networkOk) {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          {`Please switch your wallet to ${config.netName} to continue`}
        </div>
      </>
    )
  }

  return (
    <>
      {label}
      {!cryptoSelected ? null : (
        <div className="pay-with-crypto">
          <table>
            <thead>
              <tr>
                <th>Cryptocurrency</th>
                <th>Amount</th>
                <th>Exchange Rate</th>
              </tr>
            </thead>
            <tbody>
              {acceptedTokens.map((token) => {
                const isActive = activeToken.id === token.id
                return (
                  <tr key={token.id} onClick={() => setActiveToken(token)}>
                    <td className="input-container">
                      <input
                        type="radio"
                        value={token.id}
                        checked={isActive}
                        onChange={() => setActiveToken(token)}
                      />
                      <div className={`token-logo${isActive ? ' active' : ''}`}>
                        <img
                          src={`images/payment/${token.name.toLowerCase()}.svg`}
                        />
                      </div>
                      <div>{token.name}</div>
                    </td>
                    <td>{`${toTokenPrice(cart.total, token.name)} ${
                      token.name
                    }`}</td>
                    <td>
                      {`1 ${token.name} = $${(
                        1 / exchangeRates[token.name]
                      ).toFixed(2)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!activeToken.id || token.loading ? null : token.error ? (
            <div className="alert alert-danger">{token.error}</div>
          ) : !token.hasBalance ? (
            <div className="alert alert-danger">Insufficient balance</div>
          ) : !token.hasAllowance ? (
            <div className="alert alert-info d-flex align-items-center justify-content-center">
              {`Please approve this ${activeToken.name} transaction to continue`}
              <button
                className={`btn btn-outline-primary btn-rounded btn-sm ml-3${
                  approveUnlockTx || unlockTx ? ' disabled' : ''
                }`}
                onClick={async () => {
                  if (approveUnlockTx || unlockTx) {
                    return false
                  }
                  const amount = toTokenPrice(cart.total, activeToken.name)
                  const amountWei = ethers.utils.parseUnits(amount, 'ether')
                  setApproveUnlockTx(true)
                  token.contract
                    .approve(marketplace.address, amountWei)
                    .then((tx) => {
                      setUnlockTx(true)
                      setApproveUnlockTx(false)
                      return tx.wait()
                    })
                    .then(() => {
                      return new Promise((resolve, reject) => {
                        wallet.signer.getAddress().then((address) => {
                          let i = 0
                          const int = setInterval(() => {
                            token.contract
                              .allowance(marketplace.address, address)
                              .then((amount) => {
                                console.log({ amount })
                                if (i > 2) {
                                  clearInterval(int)
                                  resolve()
                                }
                                i += 1
                              })
                              .catch(reject)
                          }, 5000)
                        })
                      })
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
                  : 'Approve'}
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
    padding-left: 2.25rem
    padding-right: 0.5rem
    padding-bottom: 0.75rem
    .alert
      &.alert-danger
        background-color: #ffeeee
        border-color: #ff0000
        color: #ff0000
      text-align: center
      font-size: 0.75rem
      padding-top: 0.375rem
      padding-bottom: 0.375rem
      margin-top: 0.5rem
      margin-bottom: 0.25rem
    table
      width: 100%
      thead
        tr
          background-color: #fafbfc
          border-top: 1px solid #cdd7e0
          border-bottom: 1px solid #cdd7e0
        th
          background-color: #fafbfc
          font-size: 0.75rem
          font-weight: normal
          color: #9faebd
          padding: 0.5rem
      tbody
        tr
          border-bottom: 1px solid #cdd7e0
          cursor: pointer
          td
            font-size: 0.75rem
            color: #000
            padding: 0.5rem

            &.input-container
              display: flex
              align-items: center
              .token-logo
                width: 15px
                height: 15px
                display: flex
                align-items: center
                justify-content: center
                border-radius: 50%
                background-color: #cdd7e0
                margin-right: 5px

                &.active
                  background-color: #000

              img
                height: 9px
                width: 9px
                object-fit: contain

              input
                margin-right: 10px
          &:last-child
            border-bottom: 0
            td
              border-bottom: 0


  @media (max-width: 767.98px)
    .pay-with-crypto
      .tokens
        flex-direction: column
        > div:not(:last-child)
          margin-bottom: 1rem
`)
