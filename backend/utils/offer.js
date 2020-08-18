const openpgp = require('openpgp')

const { getConfig } = require('./encryptedConfig')
const { getText, getIPFSGateway } = require('./_ipfs')

const { getLogger } = require('./logger')
const log = getLogger('utils.offer')

const IPFS_TIMEOUT = 60000 // 60 sec

/**
 * Loads an offer from IPFS and its associated encrypted data.
 * Returns the offer object and the decrypted data.
 *
 * @param {models.Shop} shop
 * @param {string} ipfsHash: IPFS hash of an offer for the shop.
 * @returns {Promise<{offer: Object, data: Object}>}
 */
async function getShopOfferData(shop, ipfsHash) {
  // Load the shop configuration to read things like PGP key and IPFS gateway to use.
  const shopConfig = getConfig(shop.config)
  const { dataUrl, pgpPrivateKey, pgpPrivateKeyPass } = shopConfig
  const ipfsGateway = await getIPFSGateway(dataUrl, shop.networkId)
  log.info(`Using IPFS gateway ${ipfsGateway} for fetching offer data`)

  // Load the offer data.
  log.info(`Fetching offer data with hash ${ipfsHash}`)
  const offerData = await getText(ipfsGateway, ipfsHash, IPFS_TIMEOUT)
  const offer = JSON.parse(offerData)

  // Get the hash of the encrypted data.
  const encryptedHash = offer.encryptedData
  if (!encryptedHash) {
    throw new Error('No encrypted data found')
  }

  // Load the encrypted data from IPFS and decrypt it.
  log.info(`Fetching encrypted offer data with hash ${encryptedHash}`)
  const encryptedDataJson = await getText(
    ipfsGateway,
    encryptedHash,
    IPFS_TIMEOUT
  )
  const encryptedData = JSON.parse(encryptedDataJson)

  const privateKey = await openpgp.key.readArmored(pgpPrivateKey)
  const privateKeyObj = privateKey.keys[0]
  await privateKeyObj.decrypt(pgpPrivateKeyPass)

  const message = await openpgp.message.readArmored(encryptedData.data)
  const options = { message, privateKeys: [privateKeyObj] }

  const plaintext = await openpgp.decrypt(options)
  const data = JSON.parse(plaintext.data)

  return { offer, data }
}

module.exports = {
  getShopOfferData
}
