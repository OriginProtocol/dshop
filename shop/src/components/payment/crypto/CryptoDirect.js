import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import ethers from 'ethers'
import fbt from 'fbt'

import useConfig from 'utils/useConfig'
import usePrice from 'utils/usePrice'
import useToken from 'utils/useToken'
import useWallet from 'utils/useWallet'
import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

import WalletNotReady from './_WalletNotReady'
import TokenList from './_TokenList'

const PayWithCryptoDirect = ({ submit, encryptedData, onChange, loading }) => {
  const { config } = useConfig()
  const [{ cart }, dispatch] = useStateValue()
  const [activeToken, setActiveToken] = useState({})
  const [tokenPrice, setTokenPrice] = useState('')
  const [walletBalance, setWalletBalance] = useState({
    isZero: false
  }) //create an object called walletBalance, assuming for now that the buyer has some ETH in it already.
  const token = useToken(activeToken, cart.total)
  const { toTokenPrice } = usePrice(config.currency)
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

      const codeResponse = await post('/crypto/payment-code', {
        body: JSON.stringify({
          fromAddress,
          toAddress: config.walletAddress,
          amount: cart.total,
          currency: config.currency
        })
      })

      let execPromise
      if (token.contract) {
        execPromise = token.contract.transfer(config.walletAddress, amountWei)
      } else {
        execPromise = wallet.signer.sendTransaction({
          to: config.walletAddress,
          value: amountWei
        })
      }

      execPromise
        .then((tx) => {
          onChange({ disabled: true, buttonText: 'Confirming transaction...' })

          post('/crypto/payment', {
            body: JSON.stringify({
              txHash: tx.hash,
              fromAddress,
              toAddress: config.walletAddress,
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
    const queryWalletBalance = async (address) => {
      return await wallet.provider.getBalance(address)
    } //returns a promise that, if resolved, will give the balance of the wallet in wei (BigNumber)

    onChange(
      queryWalletBalance(wallet.address)
        .then((res) =>
          setWalletBalance({
            isZero: res.isZero() //boolean to check whether balance is zero. Reference: https://docs.ethers.io/v5/api/utils/bignumber/
          })
        )
        .catch((err) => console.log('Failed to query wallet balance.\n' + err))
    )
  }, [wallet.address, activeToken.id, cryptoSelected])
  // The 'useEffect' hook above verifies that the buyer's wallet has a positive ETH balance,
  // and runs every time they change their connected crypto account, the payment token of choice, or the 'Cryptocurrency' payment option.

  useEffect(() => {
    const newState = {
      submit: 0,
      disabled:
        wallet.status !== 'enabled' ||
        !activeToken.id ||
        !token.hasBalance ||
        token.loading ||
        walletBalance.isZero
    }

    if (activeToken.id) {
      newState.buttonText = `Pay ${toTokenPrice(
        cart.total,
        activeToken.name
      )} ${activeToken.name}`
      setTokenPrice(newState.buttonText)
    }

    onChange(newState)
    dispatch({ type: 'updateActiveToken', token: activeToken.id })
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

  if (!config.walletAddress) {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          <fbt desc="checkout.payment.crypto.unavailable">
            Sorry, crypto payments are unavailable.
          </fbt>
        </div>
      </>
    )
  }

  if (!wallet.ready) {
    return <WalletNotReady {...{ wallet, label, config }} />
  }

  return (
    <>
      {label}
      {!cryptoSelected ? null : (
        <div className="pay-with-crypto">
          <TokenList
            {...{
              acceptedTokens,
              activeToken,
              setActiveToken,
              loading,
              config,
              cart
            }}
          />

          {!activeToken.id || token.loading ? null : token.error ? (
            <div className="alert alert-danger">{token.error}</div>
          ) : !token.hasBalance ? (
            <div className="alert alert-danger">
              <fbt desc="checkout.payment.crypto.insufficientBalance">
                Insufficient
                <fbt:param name="activeToken">{activeToken.name}</fbt:param>
                balance
              </fbt>
            </div>
          ) : null}

          {!activeToken.id || token.loading ? null : walletBalance.isZero ? (
            <div className="alert alert-danger">
              <fbt desc="checkout.payment.crypto.ethBalanceZero">
                You will need some ETH to pay for gas fees. Please deposit some
                Ether and refresh the page to continue.
              </fbt>
            </div>
          ) : null}
        </div>
      )}
    </>
  )
}

export default PayWithCryptoDirect
