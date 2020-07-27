import React, { useState } from 'react'

// import useConfig from 'utils/useConfig'
// import useWallet from 'utils/useWallet'
import useOrigin from 'utils/useOrigin'
import { createListing, waitForCreateListing } from 'utils/listing'

import Web3Transaction from 'components/Web3Transaction'

const CreateListing = ({ className, children, onCreated }) => {
  const { marketplace } = useOrigin()
  const [submit, setSubmit] = useState()

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
        execTx={({ config, signer }) =>
          createListing({ marketplace, config, signer })
        }
        awaitTx={waitForCreateListing}
        onSuccess={onCreated}
        onReset={() => setSubmit(false)}
      />
    </>
  )
}

export default CreateListing
