const chai = require('chai')
const expect = chai.expect

const { apiRequest } = require('./utils')
const {
  PGP_PUBLIC_KEY,
  ROOT_BACKEND_URL,
  TEST_NETWORK_ID,
  USER_EMAIL_1,
  USER_PASS_1,
  TEST_LISTING_ID_1,
  TEST_HASH_1,
  IPFS_GATEWAY,
  TEST_SHOP_TOKEN_1,
  TEST_UNSTOPPABLE_DOMAIN_1
} = require('./const')

describe('Orders', () => {
  let shopId
  before(async () => {})

  // TODO: Move this to setup/fixture?
  it('create super admin', async () => {
    // This explicitly only works in testing to avoid actual deployments
    const body = {
      name: 'Test user',
      email: USER_EMAIL_1,
      password: USER_PASS_1,
      superuser: true
    }
    const jason = await apiRequest({
      method: 'POST',
      endpoint: '/auth/registration',
      body
    })

    expect(jason.success).to.be.true
  })

  it('login super admin', async () => {
    const body = {
      email: USER_EMAIL_1,
      password: USER_PASS_1
    }

    const jason = await apiRequest({
      method: 'POST',
      endpoint: '/superuser/login',
      body
    })

    expect(jason.success).to.be.true
  })

  it('activate local network', async () => {
    const jason = await apiRequest({
      method: 'POST',
      endpoint: `/networks/${TEST_NETWORK_ID}/make-active`
    })

    expect(jason.success).to.be.true
  })

  it('should create a shop', async () => {
    const body = {
      name: 'Test Shop',
      dataDir: TEST_SHOP_TOKEN_1,
      pgpPublicKey: PGP_PUBLIC_KEY,
      shopType: 'single-product',
      backend: ROOT_BACKEND_URL,
      listingId: TEST_LISTING_ID_1
    }

    const jason = await apiRequest({
      method: 'POST',
      endpoint: '/shop',
      body
    })

    expect(jason.success).to.be.true
    shopId = jason.shopId
  })

  it('should add a deployment', async () => {
    // This explicitly only works in testing to avoid actual deployments
    const jason = await apiRequest({
      method: 'POST',
      endpoint: `/shops/${shopId}/create-deployment`,
      body: {
        ipfsHash: TEST_HASH_1,
        ipfsGateway: IPFS_GATEWAY
      },
      headers: {
        Authorization: `Bearer ${TEST_SHOP_TOKEN_1}`
      }
    })

    expect(jason.success).to.be.true
    expect(jason.deployment.id).to.be.a('number')
    expect(jason.deployment.shopId).to.be.a('number')
    expect(jason.deployment.ipfsGateway).to.be.a('string')
    expect(jason.deployment.ipfsGateway).to.be.equal(IPFS_GATEWAY)
    expect(jason.deployment.ipfsHash).to.be.a('string')
    expect(jason.deployment.ipfsHash).to.be.equal(TEST_HASH_1)
  })

  it('should set a name for a deployment', async () => {
    const jason = await apiRequest({
      method: 'POST',
      endpoint: `/shops/${shopId}/set-names`,
      body: {
        ipfsHash: TEST_HASH_1,
        hostnames: [TEST_UNSTOPPABLE_DOMAIN_1]
      },
      headers: {
        Authorization: `Bearer ${TEST_SHOP_TOKEN_1}`
      }
    })

    expect(jason.success).to.be.true
    expect(jason.ipfsHash).to.be.equal(TEST_HASH_1)
    expect(jason.names).to.be.an('array')
    expect(jason.names).to.have.lengthOf(1)
    expect(jason.names[0]).to.be.equal(TEST_UNSTOPPABLE_DOMAIN_1)
  })

  it('should get a names for a shop', async () => {
    const jason = await apiRequest({
      endpoint: `/shops/${shopId}/get-names`,
      headers: {
        Authorization: `Bearer ${TEST_SHOP_TOKEN_1}`
      }
    })

    expect(jason.success).to.be.true
    expect(jason.names).to.be.an('array')
    expect(jason.names).to.have.lengthOf(1)
    expect(jason.names[0]).to.be.equal(TEST_UNSTOPPABLE_DOMAIN_1)
  })
})
