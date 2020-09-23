const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const fetch = require('node-fetch')
const ethers = require('ethers')

const {
  getTestWallet,
  createTestShop,
  createTestEncryptedOfferData,
  getOrCreateTestNetwork,
  generatePgpKey
} = require('./utils')
const { PaymentSession, Transaction } = require('../models')
const { TransactionTypes, TransactionStatuses } = require('../enums')

describe('Crypto Payment', () => {
  let network, shop, sellerPgpKey, sellerWallet, buyerWallet

  before(async () => {
    network = await getOrCreateTestNetwork()

    // Use account 1 as the merchant's.
    sellerWallet = getTestWallet(1)
    const sellerPk = sellerWallet.privateKey

    // Create the merchant's PGP key.
    const pgpPrivateKeyPass = 'password123'
    sellerPgpKey = await generatePgpKey('tester', pgpPrivateKeyPass)
    const pgpPublicKey = sellerPgpKey.publicKeyArmored
    const pgpPrivateKey = sellerPgpKey.privateKeyArmored

    shop = await createTestShop({
      network,
      sellerPk,
      pgpPrivateKeyPass,
      pgpPublicKey,
      pgpPrivateKey
    })

    // Use account2 as buyer.
    buyerWallet = getTestWallet(2)
  })

  async function _makePayment() {
    // Get a paymentCode
    let data = {
      fromAddress: buyerWallet.address,
      toAddress: sellerWallet.address,
      amount: 2500,
      currency: 'USD'
    }
    let response = await fetch('http://localhost:8357/crypto/payment-code', {
      headers: {
        authorization: `Bearer ${shop.authToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(data),
      method: 'POST',
      credentials: 'include'
    })
    let json = await response.json()
    expect(json).to.be.an('object')
    expect(json.success).to.be.equal(true)
    const paymentCode = json.paymentCode
    expect(paymentCode).to.be.a('string')

    // Load up the payment session row based on the payment code and validate it.
    const session = await PaymentSession.findOne({
      where: { code: paymentCode }
    })
    expect(session).to.be.an('object')
    expect(session.fromAddress).to.be.equal(data.fromAddress)
    expect(session.toAddress).to.be.equal(data.toAddress)
    expect(session.amount).to.be.equal(data.amount)
    expect(session.currency).to.be.equal(data.currency)

    // Create encrypted data for the offer.
    const { ipfsHash } = await createTestEncryptedOfferData(
      network,
      shop,
      sellerPgpKey
    )
    const encryptedDataIpfsHash = ipfsHash

    // Send a blockchain payment of 1 ETH from buyer to seller.
    const provider = new ethers.providers.JsonRpcProvider(network.provider)
    const wallet = buyerWallet.connect(provider)
    const txData = {
      to: sellerWallet.address,
      value: ethers.utils.parseEther('1.0')
    }
    const tx = await wallet.sendTransaction(txData)
    const txHash = tx.hash

    // Call the payment endpoint.
    data = {
      txHash,
      fromAddress: data.fromAddress,
      toAddress: data.toAddress,
      encryptedDataIpfsHash,
      paymentCode
    }
    response = await fetch('http://localhost:8357/crypto/payment', {
      headers: {
        authorization: `Bearer ${shop.authToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(data),
      method: 'POST',
      credentials: 'include'
    })
    json = await response.json()
    expect(json).to.be.an('object')
    expect(json.success).to.be.equal(true)

    return { data, paymentCode, txHash }
  }

  it('It should successfully make a crypto payment', async () => {
    for (const useMarketplace of [true, false]) {
      await network.update({ useMarketplace })

      const { data, paymentCode, txHash } = await _makePayment()

      // It should have created a Transaction row to track the payment.
      let transaction = await Transaction.findOne({
        where: {
          hash: txHash,
          customId: paymentCode
        }
      })
      expect(transaction).to.be.an('object')
      expect(transaction.shopId).to.be.equal(shop.id)
      expect(transaction.networkId).to.be.equal(shop.networkId)
      expect(transaction.fromAddress).to.be.equal(data.fromAddress)
      expect(transaction.toAddress).to.be.equal(data.toAddress)
      expect(transaction.type).to.be.equal(TransactionTypes.Payment)
      expect(transaction.status).to.be.equal(TransactionStatuses.Confirmed)
      expect(transaction.hash).to.be.equal(txHash)
      expect(transaction.listingId).to.be.equal(shop.listingId)
      expect(transaction.customId).to.be.equal(paymentCode)
      expect(transaction.jobId).to.be.a('string')

      // If the marketplace contract is being used, it should also have created a Transaction row
      // to track the marketplace offer transaction.
      if (useMarketplace) {
        transaction = await Transaction.findOne({
          where: {
            type: TransactionTypes.OfferCreated,
            customId: paymentCode
          }
        })
        expect(transaction).to.be.an('object')
        expect(transaction.shopId).to.be.equal(shop.id)
        expect(transaction.networkId).to.be.equal(shop.networkId)
        expect(transaction.fromAddress).to.be.equal(sellerWallet.address)
        expect(transaction.toAddress).to.be.equal(network.marketplaceContract)
        expect(transaction.type).to.be.equal(TransactionTypes.OfferCreated)
        expect(transaction.status).to.be.equal(TransactionStatuses.Confirmed)
        expect(transaction.hash).to.be.a('string')
        expect(transaction.listingId).to.be.equal(shop.listingId)
        expect(transaction.customId).to.be.equal(paymentCode)
        expect(transaction.jobId).to.be.a('string')
      }
    }
  })
})
