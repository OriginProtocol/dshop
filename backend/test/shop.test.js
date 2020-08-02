const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const kebabCase = require('lodash/kebabCase')

const { createShop } = require('../utils/shop')
const { deployShop } = require('../utils/deployShop')
const { setConfig } = require('../utils/encryptedConfig')
const { ShopDeploymentStatuses } = require('../enums')

const {
  Shop,
  ShopDeployment,
  ShopDeploymentName,
  Network
} = require('../models')

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
  IPFS_API,
  TEST_UNSTOPPABLE_DOMAIN_1
} = require('./const')

describe('Shops', () => {
  let network, shop, deployment, dataDir

  before(async () => {
    // Note: the migration inserts a network row for network id 999.
    network = await Network.findOne({ where: { networkId: 999 } })
    expect(network).to.be.an('object')
  })

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
    const shopName = 'test-shop-' + Date.now() // unique shop name.
    dataDir = shopName
    const body = {
      name: shopName,
      dataDir,
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

    shop = await Shop.findOne({ where: { name: shopName } })
    expect(shop).to.be.an('object')
    expect(shop.name).to.equal(body.name)
    expect(shop.hostname).to.startsWith(body.dataDir)
    // TODO: check shop.config
  })

  it('should deploy a shop', async () => {
    const testDomain = 'bugfreecode.ai'
    async function mockDeployFn(args) {
      return {
        ipfsHash: 'hash' + Date.now(), // Unique hash.
        ipfsPinner: IPFS_API,
        ipfsGateway: IPFS_GATEWAY,
        domain: testDomain,
        hostname: `${args.subdomain}.${testDomain}`
      }
    }
    const args = {
      OutputDir: '/tmp',
      dataDir: '/tmp/dataDir',
      network,
      shop,
      subdomain: 'test',
      pinner: undefined,
      deployFn: mockDeployFn
    }
    const { hash, domain } = await deployShop(args)

    expect(hash).to.be.an('string')
    expect(domain).to.be.equal(testDomain)

    // Check a new deployment row was created.
    deployment = await ShopDeployment.findOne({
      where: { shopId: shop.id },
      order: [['id', 'desc']]
    })
    expect(deployment).to.be.an('object')
    expect(deployment.shopId).to.equal(shop.id)
    expect(deployment.status).to.equal(ShopDeploymentStatuses.Success)
    expect(deployment.domain).to.equal(domain)
    expect(deployment.ipfsPinner).to.equal(IPFS_API)
    expect(deployment.ipfsGateway).to.equal(IPFS_GATEWAY)
    expect(deployment.ipfsHash).to.equal(hash)

    // Check a new deployment_name row was created.
    const deploymentName = await ShopDeploymentName.findOne({
      where: { ipfsHash: hash }
    })
    expect(deploymentName).to.be.an('object')
    expect(deploymentName.hostname).to.equal(`${args.subdomain}.${testDomain}`)
  })

  it('should not deploy a shop if a deploy is already running', async () => {
    // Update the previous deploy to be pending.
    await deployment.update({ status: ShopDeploymentStatuses.Pending })

    // An attempt to do a deploy on the same shop should result in an error.
    const args = {
      OutputDir: '/tmp',
      dataDir: '/tmp/dataDir',
      network,
      shop,
      subdomain: 'test',
      pinner: undefined,
      deployFn: () => {}
    }
    let error
    try {
      await deployShop(args)
    } catch (e) {
      error = e
    }
    expect(error).to.not.be.undefined
    expect(error.message).to.equal(
      'The shop is already being published. Try again in a few minutes.'
    )
  })

  it('should deploy a shop if an old deploy is pending', async () => {
    // Update the previous deployment to be pending and old.
    // Note: we use a raw query since Sequelize doesn't allow to update the created_at column.
    const anHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    await deployment.sequelize.query(
      `UPDATE shop_deployments SET status='Pending', created_at='${anHourAgo}' WHERE id = ${deployment.id};`
    )

    const testDomain = 'testsareforchampions.dev'
    async function mockDeployFn(args) {
      return {
        ipfsHash: TEST_HASH_1, // Unique hash.
        ipfsPinner: IPFS_API,
        ipfsGateway: IPFS_GATEWAY,
        domain: testDomain,
        hostname: `${args.subdomain}.${testDomain}`
      }
    }
    const args = {
      OutputDir: '/tmp',
      dataDir: '/tmp/dataDir',
      network,
      shop,
      subdomain: 'test',
      pinner: undefined,
      deployFn: mockDeployFn
    }
    const { hash, domain } = await deployShop(args)

    expect(hash).to.be.an('string')
    expect(domain).to.be.equal(testDomain)

    // Check the old deployment status was changed to a failure.
    await deployment.reload()
    expect(deployment.status).to.equal(ShopDeploymentStatuses.Failure)

    // Check a new deployment row was created.
    const newDeployment = await ShopDeployment.findOne({
      where: { shopId: shop.id },
      order: [['id', 'desc']]
    })
    expect(newDeployment.id).to.be.gt(deployment.id)
    expect(newDeployment).to.be.an('object')
    expect(newDeployment.shopId).to.equal(shop.id)
    expect(newDeployment.status).to.equal(ShopDeploymentStatuses.Success)
    expect(newDeployment.domain).to.equal(domain)
    expect(newDeployment.ipfsPinner).to.equal(IPFS_API)
    expect(newDeployment.ipfsGateway).to.equal(IPFS_GATEWAY)
    expect(newDeployment.ipfsHash).to.equal(hash)

    // Check a new deployment_name row was created.
    const newDeploymentName = await ShopDeploymentName.findOne({
      where: { ipfsHash: hash }
    })
    expect(newDeploymentName).to.be.an('object')
    expect(newDeploymentName.hostname).to.equal(
      `${args.subdomain}.${testDomain}`
    )
  })

  it('should set a name for a deployment', async () => {
    const jason = await apiRequest({
      method: 'POST',
      endpoint: `/shops/${shop.id}/set-names`,
      body: {
        ipfsHash: TEST_HASH_1,
        hostnames: [TEST_UNSTOPPABLE_DOMAIN_1]
      },
      headers: {
        Authorization: `Bearer ${dataDir}`
      }
    })

    expect(jason.success).to.be.true
    expect(jason.ipfsHash).to.be.equal(TEST_HASH_1)
    expect(jason.names).to.be.an('array')
    expect(jason.names).to.have.lengthOf(1)
    expect(jason.names[0]).to.be.equal(TEST_UNSTOPPABLE_DOMAIN_1)
  })

  it('should get names for a shop', async () => {
    const jason = await apiRequest({
      endpoint: `/shops/${shop.id}/get-names`,
      headers: {
        Authorization: `Bearer ${dataDir}`
      }
    })

    expect(jason.success).to.be.true
    expect(jason.names).to.be.an('array')
    expect(jason.names).to.have.lengthOf(3)
    expect(jason.names[0]).to.be.equal(TEST_UNSTOPPABLE_DOMAIN_1)
  })

  it('create shop logic should create a shop', async () => {
    const data = {
      networkId: 999,
      name: " Robinette's Shoop-2020 ",
      listingId: '999-001-' + Date.now(),
      authToken: 'token',
      config: setConfig({}),
      sellerId: 1,
      hostname: kebabCase('cool shoop hostname')
    }
    const resp = await createShop(data)
    const newShop = resp.shop

    expect(newShop).to.be.an('object')
    expect(newShop.name).to.be.equal(data.name.trim())
    expect(newShop.networkId).to.be.equal(data.networkId)
    expect(newShop.listingId).to.be.equal(data.listingId)
    expect(newShop.authToken).to.be.equal(data.authToken)
    expect(newShop.sellerId).to.be.equal(data.sellerId)
    expect(newShop.hostname).to.be.equal(data.hostname)
    expect(newShop.config).to.be.a('string')
  })

  it('create shop logic should refuse creating a shop with invalid arguments', async () => {
    // Shop with an empty name
    const data = {
      networkId: 999,
      name: undefined,
      listingId: '999-001-' + Date.now(),
      authToken: 'token',
      config: setConfig({}),
      sellerId: 1,
      hostname: kebabCase('cool shoop hostname')
    }
    let resp = await createShop(data)
    expect(resp.status).to.equal(400)
    expect(resp.error).to.be.a('string')

    // Shop with a non alphanumeric character in its name.
    data.name = '*bad shoop name'
    resp = await createShop(data)
    expect(resp.status).to.equal(400)
    expect(resp.error).to.be.a('string')

    // Shop with invalid listing ID
    data.name = 'good name'
    data.listingId = 'abcde'
    resp = await createShop(data)
    expect(resp.status).to.equal(400)
    expect(resp.error).to.be.a('string')

    // Shop with listing ID on incorrect network
    data.listingId = '1-001-1'
    resp = await createShop(data)
    expect(resp.status).to.equal(400)
    expect(resp.error).to.be.a('string')
  })
})
