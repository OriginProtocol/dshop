import React from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useWallet from 'utils/useWallet'
import useOrigin from 'utils/useOrigin'
import { createListing } from 'utils/listing'

const CreateListing = ({ className, children, onCreated, onError }) => {
  const { config } = useConfig()
  const [{ admin }] = useStateValue()
  const { marketplace } = useOrigin({
    marketplaceAddress: get(admin, 'network.marketplaceContract'),
    targetNetworkId: get(admin, 'network.networkId')
  })
  const { status, signerStatus, signer, ...wallet } = useWallet()
  const isDisabled = status === 'disabled' || signerStatus === 'disabled'
  const activeNetworkId = get(admin, 'network.networkId', '').toString()

  return (
    <button
      type="button"
      className={className}
      onClick={async (e) => {
        e.preventDefault()
        if (isDisabled) {
          await wallet.enable()
        }
        if (wallet.netId !== activeNetworkId) {
          onError(`Set network to ${activeNetworkId}`)
          return
        }
        createListing({ marketplace, config, network: admin.network, signer })
          .then(onCreated)
          .catch((err) => onError(err.message))
      }}
      children={children}
    />
  )
}

export default CreateListing
