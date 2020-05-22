import ethers from 'ethers'
import { get } from '@origin/ipfs'
import _get from 'lodash/get'

const provider = new ethers.providers.Web3Provider(window.ethereum)
const marketplaceAbi = [
  'event OfferCreated (address indexed party, uint indexed listingID, uint indexed offerID, bytes32 ipfsHash)',
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint256'
      },
      {
        name: '',
        type: 'uint256'
      }
    ],
    name: 'offers',
    outputs: [
      {
        name: 'value',
        type: 'uint256'
      },
      {
        name: 'commission',
        type: 'uint256'
      },
      {
        name: 'refund',
        type: 'uint256'
      },
      {
        name: 'currency',
        type: 'address'
      },
      {
        name: 'buyer',
        type: 'address'
      },
      {
        name: 'affiliate',
        type: 'address'
      },
      {
        name: 'arbitrator',
        type: 'address'
      },
      {
        name: 'finalizes',
        type: 'uint256'
      },
      {
        name: 'status',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]
window.provider = provider
const marketplaceInterface = new ethers.utils.Interface(marketplaceAbi)

const marketplaceAddr = '0x9FBDa871d559710256a2502A2517b794B482Db40'
const marketplace = new ethers.Contract(
  marketplaceAddr,
  marketplaceAbi,
  provider
)

async function getOfferFromReceipt(tx, password, config) {
  let encryptedHash, fullOfferId, offer

  if (tx.indexOf('0x') === 0) {
    const ListingId = _get(config, `listingId`)

    const receipt = await provider.getTransactionReceipt(tx)
    if (!receipt) {
      console.log('Could not find receipt')
      return null
    }

    const offerLog = receipt.logs
      .map((l) => {
        try {
          return marketplaceInterface.parseLog(l)
        } catch (e) {
          /* Ignore */
        }
      })
      .filter((l) => l)
      .find((e) => e.name === 'OfferCreated')

    const listingId = offerLog.args.listingID.toNumber()
    const offerId = offerLog.args.offerID.toNumber()
    const ipfsHash = offerLog.args.ipfsHash

    const ipfsData = await get(config.ipfsGateway, ipfsHash, 10000)
    encryptedHash = ipfsData.encryptedData

    fullOfferId = `${ListingId}-${offerId}`

    offer = await marketplace.offers(listingId, offerId)
  } else {
    encryptedHash = tx
  }

  try {
    const encryptedData = await get(config.ipfsGateway, encryptedHash, 10000)

    const msg = await openpgp.message.readArmored(encryptedData.buyerData)
    const decrypted = await openpgp.decrypt({
      message: msg,
      passwords: [password]
    })
    const cart = JSON.parse(decrypted.data)
    cart.offerId = fullOfferId

    return { cart, offer }
  } catch (err) {
    return null
  }
}

export default getOfferFromReceipt
