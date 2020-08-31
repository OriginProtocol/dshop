import React from 'react'
import fbt, { FbtParam } from 'fbt'

const WalletNotReady = ({ wallet, label, config }) => {
  if (wallet.status === 'loading') {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          <fbt desc="checkout.payment.crypto.loadingWallet">
            Loading Wallet Status...
          </fbt>
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
            <fbt desc="checkout.payment.crypto.enable">
              Enable Crypto Wallet
            </fbt>
          </button>
        </div>
      </>
    )
  } else if (wallet.status === 'no-web3') {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          <fbt desc="checkout.payment.crypto.noWallet">
            Sorry, no crypto wallet detected.
          </fbt>
        </div>
      </>
    )
  } else if (!wallet.networkOk) {
    return (
      <>
        {label}
        <div style={{ marginLeft: '2.25rem' }} className="mb-3">
          <fbt desc="checkout.payment.crypto.invalidNetwork">
            Please switch your wallet to{' '}
            <FbtParam name="networkName">{config.netName}</FbtParam> to continue
          </fbt>
        </div>
      </>
    )
  }

  return null
}

export default WalletNotReady
