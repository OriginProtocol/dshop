import ethers from 'ethers'

const networks = {}
try {
  networks.mainnet = require('@origin/contracts/build/contracts_mainnet.json')
  networks.rinkeby = require('@origin/contracts/build/contracts_rinkeby.json')
  networks.localhost = require('@origin/contracts/build/contracts.json')
} catch (e) {
  /* Ignore */
}
const tokenAbi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]

const marketplaceAbi = [
  'function makeOffer(uint listingID, bytes32 ipfsHash, uint finalizes, address affiliate, uint256 commission, uint value, address currency, address arbitrator) payable',
  'event OfferCreated (address indexed party, uint indexed listingID, uint indexed offerID, bytes32 ipfsHash)'
]

function useOrigin() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()

  const contracts = networks[localStorage.ognNetwork || 'localhost']

  // const daiAddr = contracts.DAI
  const ognAddr = contracts.OGN
  const marketplaceAddr = contracts.Marketplace_V01

  const ogn = new ethers.Contract(ognAddr, tokenAbi, signer)
  const marketplace = new ethers.Contract(
    marketplaceAddr,
    marketplaceAbi,
    signer
  )

  return { ogn, marketplace, provider, signer }
}

export default useOrigin
