import { useEffect, useState } from 'react'
import ethers from 'ethers'

import { NetworksByIdStr } from 'data/Networks'

const networks = {}
try {
  networks.mainnet = require('@origin/contracts/build/contracts_mainnet.json')
  networks.rinkeby = require('@origin/contracts/build/contracts_rinkeby.json')
  networks.localhost = require('@origin/contracts/build/contracts.json')
} catch (e) {
  /* Ignore */
}

const DefaultPaymentMethods = [
  { id: 'crypto', label: 'Crypto Currency' },
  { id: 'stripe', label: 'Credit Card' }
]

const net = localStorage.ognNetwork
const activeNetwork = NetworksByIdStr[net] || NetworksByIdStr['localhost']
const netId = String(activeNetwork.id)
const contracts = networks[activeNetwork.idStr] || {}

const DefaultTokens = [
  { id: 'token-OGN', name: 'OGN', address: contracts.OGN },
  { id: 'token-DAI', name: 'DAI', address: contracts.DAI },
  {
    id: 'token-ETH',
    name: 'ETH',
    address: ethers.constants.AddressZero
  }
]

let config, loaded

let dataSrc =
  localStorage.activeShop ||
  document.querySelector('link[rel="data-dir"]').getAttribute('href')

if (!dataSrc.endsWith('/')) {
  dataSrc += '/'
}

function useConfig() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)

  function setDataSrc(src) {
    dataSrc = src
    setReload(reload + 1)
  }

  async function fetchConfig() {
    loaded = dataSrc
    if (!config) {
      config = { backend: '', firstTimeSetup: true, netId }
    }
    if (dataSrc === 'DATA_DIR/') {
      setLoading(false)
      return
    }
    if (!loading) setLoading(true)

    try {
      const url = `${dataSrc}config.json`
      console.debug(`Loading config from ${url}...`)

      config = await fetch(url).then((raw) => raw.json())
      if (!config.backend) config.backend = ''
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

      config = {
        ...config,
        ...netConfig,
        netId,
        contracts,
        acceptedTokens,
        netName: activeNetwork.name,
        dataSrc,
        activeShop: localStorage.activeShop
      }
      setLoading(false)
    } catch (e) {
      console.error(e)
      setLoading(false)
      setError(true)
    }
  }

  function setActiveShop(shop) {
    if (localStorage.activeShop === shop) return false
    if (shop) {
      config.activeShop = shop
      localStorage.activeShop = shop
    } else {
      delete config.activeShop
      delete localStorage.activeShop
    }
    window.scrollTo(0, 0)
    setDataSrc(shop ? `${shop}/` : 'DATA_DIR/')
    return true
  }

  useEffect(() => {
    if (loaded !== dataSrc) {
      fetchConfig()
    } else {
      setLoading(false)
    }
  }, [reload])

  return {
    config,
    loading,
    error,
    setActiveShop
  }
}

export default useConfig
