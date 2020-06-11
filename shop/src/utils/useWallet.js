import { useEffect, useReducer } from 'react'
import ethers from 'ethers'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

function reducer(state, newState) {
  return { ...state, ...newState }
}

function useWallet() {
  const [{ admin, reload }, dispatch] = useStateValue()
  const { config } = useConfig()
  const [state, setState] = useReducer(reducer, { status: 'loading' })

  const providerUrl = get(admin, 'network.provider', config.provider)
  useEffect(() => {
    // Default to browser supplied provider
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const mm = get(window, 'ethereum._metamask', {})
      provider.send('net_version').then((netId) => {
        if (mm.isEnabled) {
          Promise.all([mm.isEnabled(), mm.isUnlocked(), mm.isApproved()]).then(
            ([isEnabled, isUnlocked, isApproved]) => {
              const enabled = isEnabled && isUnlocked && isApproved
              const signerStatus = enabled ? 'enabled' : 'disabled'
              setState({
                provider,
                signer: enabled ? signer : null,
                status: 'enabled',
                signerStatus,
                netId
              })
            }
          )
        } else {
          setState({
            provider,
            signer,
            status: 'enabled',
            signerStatus: 'enabled',
            netId
          })
        }
      })
    } else if (providerUrl) {
      // Fall back to provider specified by Network
      const provider = new ethers.providers.JsonRpcProvider(providerUrl)
      const signer = provider.getSigner()
      provider.send('net_version').then((netId) =>
        setState({
          provider,
          signer,
          status: 'enabled',
          signerStatus: 'disabled',
          netId
        })
      )
    } else {
      setState({ status: 'no-web3' })
    }
  }, [providerUrl, reload.provider])

  useEffect(() => {
    if (state.status !== 'enabled' || state.signerStatus !== 'enabled') {
      return
    }

    const onReload = () => dispatch({ type: 'reload', target: 'provider' })

    if (get(window, 'ethereum.on')) {
      window.ethereum.on('networkChanged', onReload)
      window.ethereum.on('accountsChanged', onReload)
    }
    return function cleanup() {
      if (get(window, 'ethereum.on')) {
        window.ethereum.off('networkChanged', onReload)
        window.ethereum.off('accountsChanged', onReload)
      }
    }
  })

  function enable() {
    return new Promise((resolve) => {
      if (!window.ethereum) {
        return resolve(false)
      }

      window.ethereum.enable().then((enabled) => {
        if (enabled) {
          // Short timeout to let MetaMask catch up
          setTimeout(function () {
            dispatch({ type: 'reload', target: 'provider' })
            resolve(true)
          }, 100)
        } else {
          resolve(false)
        }
      })
    })
  }

  return {
    enable,
    ...state,
    networkOk: String(config.netId) === String(state.netId)
  }
}

export default useWallet
