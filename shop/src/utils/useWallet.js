import { useEffect, useReducer } from 'react'
import ethers from 'ethers'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

const reducer = (state, newState) => ({ ...state, ...newState })

function useWallet() {
  const [{ admin, reload }, dispatch] = useStateValue()
  const { config } = useConfig()
  const [state, setState] = useReducer(reducer, { status: 'loading' })

  const providerUrl = get(admin, 'network.provider', config.provider)
  useEffect(() => {
    let isSubscribed = true
    // Default to browser supplied provider
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const mm = get(window, 'ethereum._metamask', {})
      provider.getNetwork().then((network) => {
        const netId = String(network.chainId === 1337 ? 999 : network.chainId)
        if (!isSubscribed) return
        if (mm.isEnabled) {
          Promise.all([mm.isEnabled(), mm.isUnlocked(), mm.isApproved()]).then(
            ([isEnabled, isUnlocked, isApproved]) => {
              if (!isSubscribed) return
              const enabled = isEnabled && isUnlocked && isApproved
              const signerStatus = enabled ? 'enabled' : 'disabled'
              signer
                .getAddress()
                .then((address) => {
                  if (!isSubscribed) return
                  setState({
                    provider,
                    signer: enabled ? signer : null,
                    status: 'enabled',
                    signerStatus,
                    netId,
                    address
                  })
                })
                .catch(() => {
                  setState({
                    provider,
                    signer: null,
                    status: 'disabled',
                    signerStatus: 'disabled',
                    netId,
                    address: null
                  })
                })
            }
          )
        } else {
          signer
            .getAddress()
            .then((address) => {
              if (!isSubscribed) return

              setState({
                provider,
                signer,
                status: 'enabled',
                signerStatus: 'enabled',
                netId,
                address
              })
            })
            .catch(() => {
              setState({
                provider,
                signer: null,
                status: 'disabled',
                signerStatus: 'disabled',
                netId,
                address: null
              })
            })
        }
      })
    } else if (providerUrl) {
      // Fall back to provider specified by Network
      const provider = new ethers.providers.JsonRpcProvider(providerUrl)
      const signer = provider.getSigner()
      provider.getNetwork().then((network) => {
        const netId = String(network.chainId === 1337 ? 999 : network.chainId)
        if (!isSubscribed) return
        setState({
          provider,
          signer,
          status: 'enabled',
          signerStatus: 'disabled',
          netId,
          address: null
        })
      })
    } else {
      setState({ status: 'no-web3' })
    }

    return () => (isSubscribed = false)
  }, [providerUrl, reload.provider, window.ethereum])

  useEffect(() => {
    const onReload = () => dispatch({ type: 'reload', target: 'provider' })

    if (get(window, 'ethereum.on')) {
      // Using chainIdChanged instead of chainChanged until Brave updates
      window.ethereum.on('chainIdChanged', onReload)
      window.ethereum.on('accountsChanged', onReload)
    }
    return function cleanup() {
      if (get(window, 'ethereum.on')) {
        window.ethereum.off('chainIdChanged', onReload)
        window.ethereum.off('accountsChanged', onReload)
      }
    }
  }, [window.ethereum])

  function enable() {
    return new Promise((resolve) => {
      if (!window.ethereum) {
        return resolve(false)
      }

      window.ethereum
        .enable()
        .then((enabled) => {
          if (enabled) {
            // Short timeout to let MetaMask catch up
            setTimeout(function () {
              dispatch({ type: 'reload', target: 'provider' })
              resolve(true)
            }, 250)
          } else {
            resolve(false)
          }
        })
        .catch(() => resolve(false))
    })
  }

  const networkOk = String(config.netId) === String(state.netId)
  const ready =
    state.status === 'enabled' && state.signerStatus === 'enabled' && networkOk

  return {
    enable,
    ...state,
    ready,
    networkOk
  }
}

export default useWallet
