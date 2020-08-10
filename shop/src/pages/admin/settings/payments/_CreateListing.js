import React, { useState } from 'react'

// import useConfig from 'utils/useConfig'
// import useWallet from 'utils/useWallet'
import useOrigin from 'utils/useOrigin'
import { createListing, waitForCreateListing } from 'utils/listing'
import useBackendApi from 'utils/useBackendApi'

import Web3Transaction from 'components/Web3Transaction'

const CreateListing = ({ className, children, onCreated }) => {
  const { marketplace } = useOrigin()
  const [submit, setSubmit] = useState()
  const { post } = useBackendApi({ authToken: true })

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setSubmit(true)}
        children={children}
      />
      <Web3Transaction
        shouldSubmit={submit}
        dependencies={[marketplace]}
        awaitTx={waitForCreateListing}
        execTx={({ config, signer }) => {
          return new Promise((resolve) => {
            signer.getAddress().then((walletAddressRaw) => {
              post('/shop/wallet', {
                body: JSON.stringify({ walletAddressRaw }),
                suppressError: true
              }).then(() => {
                resolve(createListing({ marketplace, config, signer }))
              })
            })
          })
        }}
        onSuccess={onCreated}
        onReset={() => setSubmit(false)}
      />
    </>
  )
}

export default CreateListing
