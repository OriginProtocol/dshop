import React from 'react'

import useConfig from 'utils/useConfig'
import useWallet from 'utils/useWallet'
import useOrigin from 'utils/useOrigin'
import { createListing } from 'utils/listing'

const CreateListing = ({ className, children, onCreated, onError }) => {
  const { config } = useConfig()
  const { marketplace } = useOrigin()
  const { status, signerStatus, signer, ...wallet } = useWallet()
  const isDisabled = status === 'disabled' || signerStatus === 'disabled'

  return (
    <button
      type="button"
      className={className}
      onClick={async (e) => {
        e.preventDefault()
        if (isDisabled) {
          await wallet.enable()
        }
        if (!wallet.networkOk) {
          onError(`Set network to ${config.netName}`)
          return
        }
        createListing({ marketplace, config, signer })
          .then(onCreated)
          .catch((err) => onError(err.message))
      }}
      children={children}
    />
  )
}

export default CreateListing
