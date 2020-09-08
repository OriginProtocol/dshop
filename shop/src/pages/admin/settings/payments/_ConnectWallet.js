import React, { useState } from 'react'

import Web3WalletConnect from 'components/Web3WalletConnect'

const ConnectWallet = ({ className, children, onCreated, setState }) => {
  const [submit, setSubmit] = useState()
  return (
    <>
      {children ? (
        <button
          type="button"
          className={className}
          onClick={() => setSubmit(true)}
          children={children}
        />
      ) : null}
      <Web3WalletConnect
        shouldSubmit={submit}
        onSuccess={(signer) => {
          return new Promise(() => {
            signer.getAddress().then((walletAddress) => {
              console.log('CONNECTED WALLET', walletAddress)
              setState({ walletAddress })
            })
          })
        }}
        submit={submit}
        onCreated={onCreated}
        onReset={() => setSubmit(false)}
      />
    </>
  )
}

export default ConnectWallet
