import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import ethers from 'ethers'
import fbt from 'fbt'

import ipfs from '@origin/ipfs'

import useConfig from 'utils/useConfig'
import usePrice from 'utils/usePrice'
import useToken from 'utils/useToken'
import useWallet from 'utils/useWallet'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

import WalletNotReady from './_WalletNotReady'

const PayWithCryptoDirect = ({ submit, encryptedData, onChange, loading }) => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()
  const [activeToken, setActiveToken] = useState({})
  const [tokenPrice, setTokenPrice] = useState('')
  const token = useToken(activeToken, cart.total)
  const { toTokenPrice, toFiatPrice } = usePrice(config.currency)
  const wallet = useWallet({ needSigner: true })
  const { post } = useBackendApi({ authToken: true })

  const paymentMethods = get(config, 'paymentMethods', [])
  const cryptoSelected = get(cart, 'paymentMethod.id') === 'crypto'
  const cryptoPaymentMethod = paymentMethods.find((o) => o.id === 'crypto')

  useEffect(() => {
    async function makeOffer() {
      onChange({
        disabled: true,
        loading: true,
        buttonText: 'Awaiting approval...'
      })

      const amount = toTokenPrice(cart.total, activeToken.name)
      const amountWei = ethers.utils.parseUnits(amount, 'ether')
      const fromAddress = await wallet.signer.getAddress()

      const offerIpfs = await ipfs.post(config.ipfsApi, {
        schemaId: 'https://schema.originprotocol.com/offer_2.0.0.json',
        listingId: config.listingId,
        listingType: 'unit',
        unitsPurchased: 1,
        totalPrice: { amount: 0, currency: 'encrypted' },
        commission: { currency: 'OGN', amount: '0' },
        finalizes: 0,
        encryptedData: encryptedData.hash
      })

      const codeResponse = await post('/crypto/payment-code', {
        body: JSON.stringify({
          fromAddress,
          toAddress: config.sellerAccount,
          amount: cart.total,
          currency: config.currency
        })
      })

      token.contract
        .transfer(config.sellerAccount, amountWei)
        .then((tx) => {
          onChange({ disabled: true, buttonText: 'Confirming transaction...' })

          post('/crypto/payment', {
            body: JSON.stringify({
              txHash: tx.hash,
              fromAddress,
              toAddress: config.sellerAccount,
              encryptedDataIpfsHash: encryptedData.hash,
              paymentCode: codeResponse.paymentCode
            })
          }).then(() => {
            tx.wait().then(() => {
              onChange({ tx: encryptedData.hash })
            })
          })
        })
        .catch((err) => {
          console.error(err)
          onChange({ disabled: false, loading: false, buttonText: tokenPrice })
        })
    }
    if (cryptoSelected && submit && wallet.signer) {
      makeOffer()
    }
  }, [submit, wallet.signer])

  if (!cryptoPaymentMethod) {
    return null
  }

  const acceptedTokens = config.acceptedTokens

  useEffect(() => {
    const newState = {
      submit: 0,
      disabled:
        wallet.status !== 'enabled' ||
        !activeToken.id ||
        !token.hasBalance ||
        token.loading
    }
    if (activeToken.id) {
      newState.buttonText = `Pay ${toTokenPrice(
        cart.total,
        activeToken.name
      )} ${activeToken.name}`
      setTokenPrice(newState.buttonText)
    }
    onChange(newState)
  }, [activeToken.id, token.loading, cryptoSelected])

  const label = (
    <label className={`radio${cryptoSelected ? '' : ' inactive'}`}>
      <input
        type="radio"
        name="paymentMethod"
        checked={cryptoSelected}
        disabled={loading}
        onChange={() => {
          if (loading) return
          dispatch({ type: 'updatePaymentMethod', method: cryptoPaymentMethod })
        }}
      />
      <fbt desc="Cryptocurrency">Cryptocurrency</fbt>
    </label>
  )

  if (!cryptoSelected) {
    return label
  }

  if (!wallet.ready) {
    return <WalletNotReady {...{ wallet, label, config }} />
  }

  return (
    <>
      {label}
      {!cryptoSelected ? null : (
        <div className="pay-with-crypto">
          <table>
            <thead>
              <tr>
                <th>
                  <fbt desc="Cryptocurrency">Cryptocurrency</fbt>
                </th>
                <th>
                  <fbt desc="Amount">Amount</fbt>
                </th>
                <th>
                  <fbt desc="ExchangeRate">Exchange Rate</fbt>
                </th>
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
                        disabled={loading}
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
                    <td>{`1 ${token.name} = ${toFiatPrice(
                      100,
                      token.name
                    )}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!activeToken.id || token.loading ? null : token.error ? (
            <div className="alert alert-danger">{token.error}</div>
          ) : !token.hasBalance ? (
            <div className="alert alert-danger">
              <fbt desc="checkout.payment.crypto.insufficientBalance">
                Insufficient balance
              </fbt>
            </div>
          ) : null}
        </div>
      )}
    </>
  )
}

export default PayWithCryptoDirect
