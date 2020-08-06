const chai = require('chai')
const expect = chai.expect

const getEmailTransporterAndConfig = require('../utils/emails/getTransport')

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  updateShopConfig
} = require('./utils')

describe('Orders', () => {
  let shop, network

  before(async () => {
    network = await getOrCreateTestNetwork()

    // Use account 1 as the merchant's.
    const sellerWallet = getTestWallet(1)
    const sellerPk = sellerWallet.privateKey

    // Create the merchant's PGP key.
    const pgpPrivateKeyPass = 'password123'
    const key = await generatePgpKey('tester', pgpPrivateKeyPass)
    const pgpPublicKey = key.publicKeyArmored
    const pgpPrivateKey = key.privateKeyArmored

    shop = await createTestShop({
      network,
      sellerPk,
      pgpPrivateKeyPass,
      pgpPublicKey,
      pgpPrivateKey
    })
  })

  it(`Should fallback to network's config`, async () => {
    network = await getOrCreateTestNetwork({
      fallbackShopConfig: {
        email: 'aws'
      }
    })

    const updatedShop = await updateShopConfig(shop, {
      supportEmail: 'test@support.email',
      storeEmail: 'test@store.email'
    })

    const out = await getEmailTransporterAndConfig(updatedShop, true)

    expect(out.transporter.config.email).to.be.equal('aws')
    expect(out.fromEmail).to.be.equal('support@ogn.app')
    expect(out.replyTo).to.be.equal('test@support.email')
    expect(out.supportEmail).to.be.equal('test@support.email')
    expect(out.storeEmail).to.be.equal('test@store.email')
  })

  it(`Should use shop's config if available`, async () => {
    network = await getOrCreateTestNetwork({
      fallbackShopConfig: {
        email: 'aws'
      }
    })

    const updatedShop = await updateShopConfig(shop, {
      supportEmail: 'test@support.email',
      storeEmail: 'test@store.email',
      email: 'sendgrid'
    })

    const out = await getEmailTransporterAndConfig(updatedShop, true)

    expect(out.transporter.config.email).to.be.equal('sendgrid')
    expect(out.fromEmail).to.be.equal('test@support.email')
    expect(out.replyTo).to.be.undefined
    expect(out.supportEmail).to.be.equal('test@support.email')
    expect(out.storeEmail).to.be.equal('test@store.email')
  })
})
