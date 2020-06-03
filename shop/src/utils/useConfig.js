import { useEffect, useState } from 'react'
import ethers from 'ethers'

const networks = {}
try {
  networks.mainnet = require('@origin/contracts/build/contracts_mainnet.json')
  networks.rinkeby = require('@origin/contracts/build/contracts_rinkeby.json')
  networks.localhost = require('@origin/contracts/build/contracts.json')
} catch (e) {
  /* Ignore */
}

import dataUrl from 'utils/dataUrl'

const DefaultPaymentMethods = [
  { id: 'crypto', label: 'Crypto Currency' },
  { id: 'stripe', label: 'Credit Card' }
]

const net = localStorage.ognNetwork || 'localhost'
const netId = net === 'mainnet' ? '1' : net === 'rinkeby' ? '4' : '999'
const contracts = networks[net] || {}

const DefaultTokens = [
  { id: 'token-OGN', name: 'OGN', address: contracts.OGN },
  { id: 'token-DAI', name: 'DAI', address: contracts.DAI },
  {
    id: 'token-ETH',
    name: 'ETH',
    address: ethers.constants.AddressZero
  }
]

let config

function useConfig() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchConfig() {
      config = { backend: '', firstTimeSetup: true, netId }
      setLoading(true)
      try {
        const url = `${dataUrl()}config.json`
        console.debug(`Loading config from ${url}...`)

        config = await fetch(url).then((raw) => raw.json())
        if (!config.paymentMethods) {
          config.paymentMethods = DefaultPaymentMethods
        }
        let supportEmailPlain = config.supportEmail
        if (supportEmailPlain.match(/<([^>]+)>/)[1]) {
          supportEmailPlain = supportEmailPlain.match(/<([^>]+)>/)[1]
        }

        config.supportEmailPlain = supportEmailPlain
        const netConfig = config.networks[netId] || {}
        if (netId === '999' && process.env.MARKETPLACE_CONTRACT) {
          // Use the address of the marketplace contract deployed on the local test network.
          netConfig.marketplaceContract = process.env.MARKETPLACE_CONTRACT
        }
        const acceptedTokens = (
          netConfig.acceptedTokens ||
          config.acceptedTokens ||
          DefaultTokens
        )
          .map((token) => {
            if (token.name === 'ETH') {
              token.address = ethers.constants.AddressZero
            } else if (!token.address && contracts[token.name]) {
              token.address = contracts[token.name]
            }
            return token
          })
          .filter((token) => token.address)

        const netName =
          netId === '1'
            ? 'Mainnet'
            : netId === '4'
            ? 'Rinkeby'
            : `Net ID ${netId}`

        config = {
          ...config,
          ...netConfig,
          netId,
          contracts,
          acceptedTokens,
          netName
        }
        setLoading(false)
      } catch (e) {
        console.error(e)
        setLoading(false)
        setError(true)
      }
    }
    if (config === undefined) {
      fetchConfig()
    }
  }, [])

  return { config, loading, error }
}

export default useConfig
