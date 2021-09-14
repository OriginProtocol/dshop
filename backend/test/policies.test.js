const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect

const { ROOT_BACKEND_URL } = require('./const')
const {
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
    //If an admin just clicks on the 'Update' button without adding any policy, the server should just return a '200' response

    await chai
      .request(`${ROOT_BACKEND_URL}`)
      .post('/shop/policies')
      .set({
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      })
      .send(JSON.stringify(testPolicies1))
      .then((response) => {
        expect(response).to.have.status(200)
        expect(response.body.allPolicies).to.eql(testPolicies1)
      })
      .catch((err) => {
        throw err
      })

    //Otherwise, the response should be formatted as a plain object, containing the contents of the created/updated model

    await chai
      .request(`${ROOT_BACKEND_URL}`)
      .post('/shop/policies')
      .set({
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      })
      .send(JSON.stringify(testPolicies2))
      .then((response) => {
        expect(response).to.have.status(200)
        expect(response.body.allPolicies).to.eql(testPolicies2)
      })
      .catch((err) => {
        throw err
      })

    await chai
      .request(`${ROOT_BACKEND_URL}`)
      .post('/shop/policies')
      .set({
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      })
      .send(JSON.stringify(testPolicies3))
      .then((response) => {
        expect(response).to.have.status(200)
        expect(response.body.allPolicies).to.eql(testPolicies3)
      })
      .catch((err) => {
        throw err
      })
  })

  it('Should get shop policies', async () => {
    //The response body should be made up of the 'allPolicies' column of the model 'Policies'.
    await chai
      .request(`${ROOT_BACKEND_URL}`)
      .get('/shop/policies')
      .set({
        authorization: `bearer ${shop.authToken}`,
        'Content-Type': 'application/json'
      })
      .then((response) => {
        expect(response).to.have.status(200)
        expect(response.body).to.eql(testPolicies3)
      })
      .catch((err) => {
        throw err
      })
  })
})
