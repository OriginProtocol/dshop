const crypto = require('crypto')
const openpgp = require('openpgp')

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

module.exports = genPGP
