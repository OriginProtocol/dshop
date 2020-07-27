const ethers = require('ethers')

const {
  marketplaceAbi,
  marketplaceTxGasLimit
} = require('@origin/utils/marketplace')

const { post, getBytes32FromIpfsHash } = require('./_ipfs')
const { getLogger } = require('../utils/logger')

const log = getLogger('utils.createListing')

const baseListing = {
  __typename: 'UnitListing',
  schemaId: 'https://schema.originprotocol.com/listing_3.0.0.json',
  title: undefined,
  listingType: 'unit',
  category: 'schema.forSale',
  subCategory: 'schema.clothingAccessories',
  language: 'en-US',
  description: 'Origin DShop Store',
  media: [],
  price: {
    amount: '0',
    currency: 'fiat-USD'
  },
  amount: '0',
  currency: 'fiat-USD',
  acceptedTokens: ['token-ETH'],
  commission: {
    currency: 'OGN',
    amount: '0'
  },
  commissionPerUnit: {
    currency: 'OGN',
    amount: '0'
  },
  requiresShipping: false,
  unitsTotal: 1000,
  shopIpfsHash: undefined
}

/**
 * Utility method for creating a listing on the marketplace.
 *
 * @param {models.Network} network
 * @param {string} pk: Primary key of the account.
 * @param {Object} listing: listing metadata
 * @returns {Promise<string>} Fully qualified listing ID.
 */
async function createListing({ network, pk, listing }) {
  if (!network) {
    throw new Error('No network specified')
  }
  if (!pk) {
    throw new Error('No private key specified')
  }
  if (!network.ipfsApi) {
    throw new Error('Network has no ipfsApi specified')
  }
  if (!network.marketplaceContract) {
    throw new Error('Network has no marketplaceContract specified')
  }
  if (!network.provider) {
    throw new Error('Network has no provider specified')
  }

  const provider = new ethers.providers.JsonRpcProvider(network.provider)
  const wallet = new ethers.Wallet(pk, provider)
  const marketplace = new ethers.Contract(
    network.marketplaceContract,
    marketplaceAbi,
    wallet
  )
  log.info(`Using wallet ${wallet.address}`)

  const balance = await wallet.getBalance()
  if (balance.eq(0)) {
    throw new Error('Not enough balance')
  }

  // Upload the listing's metadata to IPFS.
  let ipfsBytes
  try {
    const ipfsHash = await post(network.ipfsApi, listing, true)
    ipfsBytes = getBytes32FromIpfsHash(ipfsHash)
  } catch (err) {
    throw new Error(`Error adding listing to ${network.ipfsApi}`)
  }

  // Send the transaction to the network and wait for it to get mined.
  const options = { gasLimit: marketplaceTxGasLimit }
  const tx = await marketplace.createListing(
    ipfsBytes,
    0,
    wallet.address,
    options
  )
  const receipt = await tx.wait()

  // Extract the ListingCreated event from the tx receipt in order to get the listing id.
  const listingCreated = receipt.events.find(
    (e) => e.event === 'ListingCreated'
  )
  if (!listingCreated) {
    throw new Error(`No ListingCreated event found`)
  }
  const listingId = listingCreated.args.listingID.toNumber()

  return `${network.networkId}-${network.marketplaceVersion}-${listingId}`
}

module.exports = {
  createListing,
  baseListing
}
