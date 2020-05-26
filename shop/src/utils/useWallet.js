import { useEffect, useState } from 'react'
import ethers from 'ethers'
import get from 'lodash/get'
import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

function useWallet() {
  const [{ admin }] = useStateValue()
  const { config } = useConfig()
  const [state, setStateRaw] = useState({ status: 'loading' })
  const setState = (newState) => setStateRaw({ ...state, ...newState })

  const providerUrl = get(admin, 'network.provider', config.provider)
  useEffect(() => {
    // Default to browser supplied provider
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const mm = get(window, 'ethereum._metamask')
      if (mm.isEnabled) {
        Promise.all([mm.isEnabled(), mm.isUnlocked(), mm.isApproved()]).then(
          ([isEnabled, isUnlocked, isApproved]) => {
            const enabled = isEnabled && isUnlocked && isApproved
            setState({ provider, status: enabled ? 'enabled' : 'disabled' })
          }
        )
      } else {
        setState({ provider, status: 'enabled' })
      }
    } else if (providerUrl) {
      // Fall back to provider specified by Network
      const provider = new ethers.providers.JsonRpcProvider(providerUrl)
      setState({ provider, status: 'enabled' })
    } else {
      setState({ status: 'no-web3' })
    }
  }, [providerUrl])

  useEffect(() => {
    if (state.status !== 'enabled') {
      return
    }

    state.provider.send('net_version').then((netId) => setState({ netId }))
    if (window.ethereum) {
      window.ethereum.on('networkChanged', (netId) => setState({ netId }))
    }
  }, [state.status])

  function enable() {
    if (!window.ethereum) {
      return
    }

    window.ethereum.enable().then((enabled) => {
      if (enabled) {
        setState({ status: 'enabled' })
      } else {
        setState({ status: 'disabled' })
      }
    })
  }

  return { enable, ...state }
}

export default useWallet
