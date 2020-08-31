import ethers from 'ethers'
import fbt from 'fbt'

import { NetworksByIdStr, NetworksById } from 'data/Networks'
import DefaultTokens from './defaultTokens'
import parsePlainEmail from 'utils/parsePlainEmail'

const networks = {}
try {
  networks.mainnet = require('@origin/contracts/build/contracts_mainnet.json')
  networks.rinkeby = require('@origin/contracts/build/contracts_rinkeby.json')
  networks.localhost = require('@origin/contracts/build/contracts.json')
} catch (e) {
  /* Ignore */
}

const DefaultPaymentMethods = [
  { id: 'crypto', label: fbt('Crypto Currency', 'paymentMethods.crypto') },
  { id: 'stripe', label: fbt('Credit Card', 'paymentMethods.stripe') },
  { id: 'paypal', label: fbt('PayPal', 'paymentMethods.paypal') },
  { id: 'uphold', label: fbt('Uphold', 'paymentMethods.uphold') }
]

let config

export async function fetchConfig(dataSrc, activeShop, overrideBackend) {
  const net = window.ognNetwork || localStorage.ognNetwork
  const activeNetwork = NetworksByIdStr[net] || NetworksByIdStr['localhost']
  const netId = String(activeNetwork.id)

  config = { backend: '', firstTimeSetup: true, netId }
  if (!dataSrc || dataSrc === 'DATA_DIR/') {
    return config
  }

  try {
    const url = `${dataSrc}config.json`
    console.debug(`Loading config from ${url}...`)

    config = await fetch(url).then((raw) => raw.json())
    if (!config.backend) config.backend = ''
    if (!config.currency) config.currency = 'USD'

    const networkConfig = activeNetworkConfig(config, netId)
    config = { ...config, ...networkConfig }

    if (!config.paymentMethods) {
      config.paymentMethods = DefaultPaymentMethods
    }
    config.supportEmailPlain = parsePlainEmail(config.supportEmail)

    config.paymentMethods = config.paymentMethods.filter((m) => {
      if (m.id === 'stripe' && !config.stripeKey) {
        return false
      } else if (m.id === 'paypal' && !config.paypalClientId) {
        return false
      } else if (m.id === 'uphold' && !config.upholdClient) {
        return false
      } else if (m.id === 'crypto' && config.disableCryptoPayments) {
        return false
      }

      return true
    })

    const result = { ...config, dataSrc, activeShop }

    // If UI is being served from backend, override 'backend' from config.json
    // returned by shops to prevent auth issues
    if (overrideBackend) {
      result.backend = window.location.origin
    }

    return result
  } catch (err) {
    console.error(err)
    return config
  }
}

export function activeNetworkConfig(config, netId) {
  const activeNetwork = NetworksById[netId]
  const contracts = networks[activeNetwork.idStr] || {}
  const netConfig = config.networks[netId] || {}

  if (netId === '999' && process.env.MARKETPLACE_CONTRACT) {
    // Use the address of the marketplace contract deployed on the local test network.
    netConfig.marketplaceContract = process.env.MARKETPLACE_CONTRACT
  }

  const tokenList =
    netConfig.acceptedTokens || config.acceptedTokens || DefaultTokens

  const acceptedTokens = tokenList
    .map((token) => {
      if (token.name === 'ETH') {
        token.address = ethers.constants.AddressZero
      } else if (!token.address && contracts[token.name]) {
        token.address = contracts[token.name]
      }
      return token
    })
    .filter((token) => token.address)

  return {
    ...netConfig,
    netId,
    contracts,
    acceptedTokens,
    netName: activeNetwork.name
  }
}
