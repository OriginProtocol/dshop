const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect

const { deployShop } = require('../utils/deployShop')
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

  /*
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
  })*/

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
      'Deployment failed. Detected concurrent deployment.'
    )
  })

  it('should deploy a shop if an old deploy is pending', async () => {
    // Update the previous deployment to be pending and old.

    // await deployment.update({ status: ShopDeploymentStatuses.Pending, createdAt: new Date(Date.now() - 30 * 60 * 1000 ) })
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

    // Check the old deployment status was changed to Failed.
    await deployment.reload()
    expect(deployment.status).to.equal(ShopDeploymentStatuses.Failed)

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
})
