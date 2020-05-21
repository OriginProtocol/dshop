import ethers from 'ethers'

export const provider = new ethers.providers.Web3Provider(window.ethereum)
export const signer = provider.getSigner()

window.ethers = ethers
window.provider = provider

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

// const daiAddr = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const ognAddr = '0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da'
const marketplaceAddr = '0x9FBDa871d559710256a2502A2517b794B482Db40'
export const ogn = new ethers.Contract(ognAddr, tokenAbi, signer)
export const marketplace = new ethers.Contract(marketplaceAddr, marketplaceAbi, signer)
