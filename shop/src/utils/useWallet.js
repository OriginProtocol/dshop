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
      const signer = provider.getSigner()
      const mm = get(window, 'ethereum._metamask')
      if (mm.isEnabled) {
        Promise.all([mm.isEnabled(), mm.isUnlocked(), mm.isApproved()]).then(
          ([isEnabled, isUnlocked, isApproved]) => {
            const enabled = isEnabled && isUnlocked && isApproved
            const status = enabled ? 'enabled' : 'disabled'
            setState({ provider, signer, status })
          }
        )
      } else {
        setState({ provider, signer, status: 'enabled' })
      }
    } else if (providerUrl) {
      // Fall back to provider specified by Network
      const provider = new ethers.providers.JsonRpcProvider(providerUrl)
      const signer = provider.getSigner()
      setState({ provider, signer, status: 'enabled' })
    } else {
      setState({ status: 'no-web3' })
    }
  }, [providerUrl])

  useEffect(() => {
    if (state.status !== 'enabled') {
      return
    }

    state.provider.send('net_version').then((netId) => setState({ netId }))

    const onNetChanged = (netId) => {
      setState({ netId })
    }
    const onAccountsChanged = (accounts) => {
      setState({ signer: state.provider.getSigner(accounts[0]) })
    }

    if (window.ethereum) {
      window.ethereum.on('networkChanged', onNetChanged)
      window.ethereum.on('accountsChanged', onAccountsChanged)
    }
    return function cleanup() {
      window.ethereum.off('networkChanged', onNetChanged)
      window.ethereum.off('accountsChanged', onAccountsChanged)
    }
  }, [state.status, state.netId, state.provider])

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

  return { enable, ...state, networkOk: config.netId === state.netId }
}

export default useWallet
