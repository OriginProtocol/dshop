import ethers from 'ethers'
import fbt from 'fbt'

import { NetworksByIdStr } from 'data/Networks'

const networks = {}
try {
  networks.mainnet = require('@origin/contracts/build/contracts_mainnet.json')
  networks.rinkeby = require('@origin/contracts/build/contracts_rinkeby.json')
  networks.localhost = require('@origin/contracts/build/contracts.json')
} catch (e) {
  /* Ignore */
}

const net = window.ognNetwork || localStorage.ognNetwork
const activeNetwork = NetworksByIdStr[net] || NetworksByIdStr['localhost']
const contracts = networks[activeNetwork.idStr] || {}

// TODO: change `name` to `symbol` and `displayName` to `name`
export default [
  {
    id: 'token-OUSD',
    name: 'OUSD',
    address: contracts.OUSD,
    displayName: fbt('Origin Dollar', 'tokens.OUSD')
  },
  {
    id: 'token-OGN',
    name: 'OGN',
    address: contracts.OGN,
    displayName: fbt('Origin Token', 'tokens.OGN')
  },
  {
    id: 'token-DAI',
    name: 'DAI',
    address: contracts.DAI,
    displayName: fbt('Maker DAI', 'tokens.DAI')
  },
  {
    id: 'token-ETH',
    name: 'ETH',
    address: ethers.constants.AddressZero,
    displayName: fbt('Ethereum', 'tokens.ETH')
  }
]
