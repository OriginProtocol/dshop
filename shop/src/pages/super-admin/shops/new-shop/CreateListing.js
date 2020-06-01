import React, { useEffect } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useWallet from 'utils/useWallet'
import { createListing } from 'utils/listing'

const CreateListing = ({ className, children, onCreated, onError }) => {
  const { config } = useConfig()
  const [{ admin }] = useStateValue()
  const { netId, provider } = useWallet()

  const activeNetId = String(get(admin, 'network.networkId'))
  useEffect(() => {
    if (netId === activeNetId) {
      onError()
    }
  }, [netId, activeNetId])

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.preventDefault()
        if (netId !== activeNetId) {
          onError(`Set network to ${activeNetId}`)
          return
        }
        createListing({ config, network: admin.network, provider })
          .then(onCreated)
          .catch((err) => onError(err.message))
      }}
      children={children}
    />
  )
}

export default CreateListing
