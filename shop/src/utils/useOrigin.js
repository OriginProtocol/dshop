import ethers from 'ethers'
import { get } from '@origin/ipfs'
import _get from 'lodash/get'

import useWallet from 'utils/useWallet'
import useConfig from 'utils/useConfig'

const marketplaceAbi = [
  'function makeOffer(uint listingID, bytes32 ipfsHash, uint finalizes, address affiliate, uint256 commission, uint value, address currency, address arbitrator) payable',
  'function acceptOffer(uint listingID, uint offerID, bytes32 ipfsHash) public',
  'function withdrawOffer(uint listingID, uint offerID, bytes32 ipfsHash) public',
  'function finalize(uint listingID, uint offerID, bytes32 ipfsHash) public',
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

const marketplaceInterface = new ethers.utils.Interface(marketplaceAbi)

async function getOfferFromTx({ tx, password, config, provider, marketplace }) {
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

function useOrigin() {
  const { config } = useConfig()
  const { status, provider } = useWallet()
  if (status !== 'enabled') return {}

  const signer = provider ? provider.getSigner() : null

  const marketplace = new ethers.Contract(
    config.contracts.Marketplace_V01,
    marketplaceAbi,
    signer || provider
  )

  function getOffer({ tx, password }) {
    return getOfferFromTx({ tx, password, config, provider, marketplace })
  }

  return { provider, signer, marketplace, getOffer }
}

export default useOrigin
