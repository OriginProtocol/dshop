const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const fetch = require('node-fetch')

const {
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey,
  MockBullJob
} = require('./utils')
const { processor } = require('../queues/makeOfferProcessor')
const { Transaction } = require('../models')
const { TransactionTypes, TransactionStatuses } = require('../enums')
const { ListingID, OfferID } = require('../utils/id')

describe('Crypto Payment', () => {
  let network, shop, job, jobId, trans

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

  it('It should make an offer', async () => {
    // Get a paymentCode
    const data = {
      fromAddress: '0x123',
      toAddress: '0x456',
      amount: '100',
      currency: 'EUR'
    }
    const response = fetch('https://localhost:8357/crypto/payment-code', {
      headers: {
        authorization: 'shopAuthToken',
        'content-type': 'application/json'
      },
      body: JSON.stringify(data),
      method: 'POST',
      credentials: 'include'
    })
    const json = await response.json()
    console.log("RESPONSE", json)

    expect(json).to.equal('TUUT')

    // Call the payment endpoint.

  })
})