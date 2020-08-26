import React from 'react'

import useOrigin from 'utils/useOrigin'
import { createListing, waitForCreateListing } from 'utils/listing'
import useBackendApi from 'utils/useBackendApi'

import Web3Transaction from 'components/Web3Transaction'

const CreateListingTx = ({ submit, onReset, onCreated }) => {
  const { marketplace } = useOrigin()
  const { post } = useBackendApi({ authToken: true })

  return (
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
      onReset={onReset}
    />
  )
}

export default CreateListingTx
