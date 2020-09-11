const chai = require('chai')
const expect = chai.expect

const { getShopTransport } = require('../utils/emails/_getTransport')

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  updateShopConfig
} = require('./utils')

describe('Emails', () => {
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
    const configOverride = {
      fallbackShopConfig: { email: 'aws' },
      notificationEmail: 'no-reply@server.com',
      notificationEmailDisplayName: 'Dshop Test'
    }
    network = await getOrCreateTestNetwork({ configOverride })

    const updatedShop = await updateShopConfig(shop, {
      supportEmail: 'test@support.email'
    })

    const out = await getShopTransport(updatedShop, network)

    expect(out.transporter.transporter.ses).to.be.ok
    expect(out.from).to.be.equal(`${shop.name} <no-reply@server.com>`)
    expect(out.replyTo).to.be.equal(`${shop.name} <test@support.email>`)
  })

  it(`Should use shop's config if available`, async () => {
    const configOverride = {
      fallbackShopConfig: { email: 'aws' },
      notificationEmail: 'no-reply@server.com',
      notificationEmailDisplayName: 'Dshop Test'
    }
    network = await getOrCreateTestNetwork({ configOverride })

    const updatedShop = await updateShopConfig(shop, {
      supportEmail: 'test@support.email',
      email: 'sendgrid'
    })

    const out = await getShopTransport(updatedShop, network)

    expect(out.transporter.transporter.options.host).to.be.equal(
      'smtp.sendgrid.net'
    )
    expect(out.from).to.be.equal(`${shop.name} <test@support.email>`)
    expect(out.replyTo).to.not.be.ok
  })
})
