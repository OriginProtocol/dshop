const crypto = require('crypto')
const openpgp = require('openpgp')

/**
 * Generates a new PGP key
 * @returns {Promise<{pgpPublicKey: string, pgpPrivateKeyPass: string, pgpPrivateKey: string}>}
 */
async function genPGP() {
  const passphrase = crypto.randomBytes(24).toString('hex')
  const key = await openpgp.generateKey({
    userIds: [{ name: 'D-Shop', email: `dshop@example.com` }],
    curve: 'ed25519',
    passphrase
  })
  const pgpPublicKey = key.publicKeyArmored.replace(/\\r/g, '')
  const pgpPrivateKey = key.privateKeyArmored.replace(/\\r/g, '')
  return { pgpPrivateKeyPass: passphrase, pgpPublicKey, pgpPrivateKey }
}

/**
 * Validates a PGP key. Throws in case the key is invalid.
 * @param {string }pgpPublicKey
 * @param {string }pgpPrivateKey
 * @param {string }pgpPrivateKeyPass
 * @returns {Promise<void>}
 * @throws
 */
async function testPGP({ pgpPublicKey, pgpPrivateKey, pgpPrivateKeyPass }) {
  if (!pgpPublicKey) throw new Error('Empty pgpPublicKey')
  if (!pgpPrivateKey) throw new Error('Empty pgpPrivateKey')
  if (!pgpPrivateKeyPass) throw new Error('Empty pgpPrivateKeyPass')

  const msg = 'Dshop > Shopify'

  const pubKeyObj = await openpgp.key.readArmored(pgpPublicKey)
  const encrypted = await openpgp.encrypt({
    message: openpgp.message.fromText(msg),
    publicKeys: pubKeyObj.keys
  })

  const privateKey = await openpgp.key.readArmored(pgpPrivateKey)
  if (privateKey.err && privateKey.err.length) {
    throw privateKey.err[0]
  }
  const privateKeyObj = privateKey.keys[0]
  await privateKeyObj.decrypt(pgpPrivateKeyPass)

  const message = await openpgp.message.readArmored(encrypted.data)
  const options = { message, privateKeys: [privateKeyObj] }

  const plaintext = await openpgp.decrypt(options)
  if (plaintext.data !== msg) {
    throw new Error('Failure to decrypt plaintest message')
  }
}

module.exports = {
  genPGP,
  testPGP
}
