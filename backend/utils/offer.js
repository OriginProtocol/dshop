const openpgp = require('openpgp')

const { getConfig } = require('./encryptedConfig')
const { getText, getIPFSGateway } = require('./_ipfs')

const { getLogger } = require('./logger')
const log = getLogger('utils.offer')

const IPFS_TIMEOUT = 60000 // 60 sec

/**
 * Loads an offer from IPFS and its associated encrypted data.
 * Returns the offer decrypted data.
 *
 * @param {models.Shop} shop
 * @param {string} ipfsHash: IPFS hash of the encrypted offer data
 * @returns {Promise<{Object}>}
 */
async function decryptShopOfferData(shop, ipfsHash) {
  // Load the shop configuration to read things like PGP key and IPFS gateway to use.
  const shopConfig = getConfig(shop.config)
  const { dataUrl, pgpPrivateKey, pgpPrivateKeyPass } = shopConfig
  const ipfsGateway = await getIPFSGateway(dataUrl, shop.networkId)
  log.info(`Using IPFS gateway ${ipfsGateway} for fetching offer data`)

  // Load the encrypted data from IPFS and decrypt it.
  log.info(`Fetching encrypted offer data with hash ${ipfsHash}`)
  const encryptedDataJson = await getText(ipfsGateway, ipfsHash, IPFS_TIMEOUT)
  const encryptedData = JSON.parse(encryptedDataJson)

  const privateKey = await openpgp.key.readArmored(pgpPrivateKey)
  const privateKeyObj = privateKey.keys[0]
  await privateKeyObj.decrypt(pgpPrivateKeyPass)

  const message = await openpgp.message.readArmored(encryptedData.data)
  const options = { message, privateKeys: [privateKeyObj] }

  const plaintext = await openpgp.decrypt(options)
  const data = JSON.parse(plaintext.data)

  return data
}

module.exports = {
  decryptShopOfferData
}
