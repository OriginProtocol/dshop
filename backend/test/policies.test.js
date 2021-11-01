const chai = require('chai')
const expect = chai.expect

const {
  apiRequest,
  getTestWallet,
  createTestShop,
  getOrCreateTestNetwork,
  generatePgpKey
} = require('./utils')

describe('Shop policies', () => {
  let shop

  before(async () => {
    //Reference: './order.test.js'
    const ntwk = await getOrCreateTestNetwork()
    const passphrase = 'abcdefghijklmnopqrstuvwxyz'
    const key = await generatePgpKey('tester', passphrase)
    const wallet = getTestWallet(1)
    shop = await createTestShop({
      network: ntwk,
      sellerPk: wallet.privateKey,
      pgpPrivateKeyPass: passphrase,
      pgpPublicKey: key.publicKeyArmored,
      pgpPrivateKey: key.privateKeyArmored
    })
  })

  // testPolicies1, testPolicies2, testPolicies3 mimic the data supplied by the FE.
  const testPolicies1 = [['', '', false]]

  const testPolicies2 = [
    [
      'Terms and Conditions',
      'Eget egestas purus viverra accumsan in nisl nisi scelerisque.',
      false
    ],
    [
      'Privacy Policy',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      false
    ],
    ['Return Policy', 'Eget egestas purus viverra accumsan.', false]
  ]

  const testPolicies3 = []

  it('Should post new shop policies', async () => {
    // If an admin just clicks on the 'Update' button without adding any policy, the server should just create a default policy entry in the DB.
    // In this test, the default entry == testPolicies1

    const query1 = await apiRequest({
      method: 'post',
      endpoint: '/shop/policies',
      body: { allPolicies: testPolicies1 },
      headers: {
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      }
    })
    expect(query1.allPolicies).to.eql(testPolicies1)

    const query2 = await apiRequest({
      method: 'post',
      endpoint: '/shop/policies',
      body: { allPolicies: testPolicies2 },
      headers: {
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      }
    })
    expect(query2.allPolicies).to.eql(testPolicies2)

    //This test handles the case where the shop admin deletes all policies [from their UI].
    const query3 = await apiRequest({
      method: 'post',
      endpoint: '/shop/policies',
      body: { allPolicies: testPolicies3 },
      headers: {
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      }
    })
    expect(query3.allPolicies).to.eql(testPolicies3)
  })

  it('Should get shop policies', async () => {
    // In this test, the GET request runs after immediately after the POST request attached to 'query3'.
    // The assertion statement is written accordingly.

    const query4 = await apiRequest({
      endpoint: '/shop/policies',
      headers: {
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      }
    })
    expect(query4).to.eql(testPolicies3)
  })
})
