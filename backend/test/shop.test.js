const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const kebabCase = require('lodash/kebabCase')

const { createShopInDB } = require('../logic/shop/create')
const { deployShop } = require('../utils/deployShop')
const { getConfig, setConfig } = require('../utils/encryptedConfig')
const { AdminLogActions, ShopDeploymentStatuses } = require('../enums')

const {
  AdminLog,
  Shop,
  ShopDeployment,
  ShopDeploymentName,
  Network
} = require('../models')

const { apiRequest } = require('./utils')
const {
  PGP_PUBLIC_KEY,
  ROOT_BACKEND_URL,
  TEST_LISTING_ID_1,
  TEST_HASH_1,
  TEST_IPFS_GATEWAY,
  TEST_IPFS_API,
  TEST_UNSTOPPABLE_DOMAIN_1
} = require('./const')

describe('Shops', () => {
  let network, shop, deployment, dataDir

  before(async () => {
    // Note: the migration inserts a network row for network id 999.
    network = await Network.findOne({ where: { networkId: 999 } })
    expect(network).to.be.an('object')
  })

  it('should create a new shop', async () => {
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
    expect(shop.listingId).to.equal(TEST_LISTING_ID_1)
    expect(shop.authToken).to.equal(dataDir)
    // TODO: check shop.config

    // Check the admin activity was recorded.
    const adminLog = await AdminLog.findOne({ order: [['id', 'desc']] })
    expect(adminLog).to.be.an('object')
    expect(adminLog.shopId).to.equal(shop.id)
    expect(adminLog.sellerId).to.equal(1) // Shop was created using super admin with id 1.
    expect(adminLog.action).to.equal(AdminLogActions.ShopCreated)
    expect(adminLog.data).to.be.null
    expect(adminLog.createdAt).to.be.a('date')
  })

  it('should update a shop config', async () => {
    const configBeforeUpdate = getConfig(shop.config)

    const body = {
      hostname: shop.hostname + '-updated',
      emailSubject: 'Updated subject'
    }

    const jason = await apiRequest({
      method: 'PUT',
      endpoint: '/shop/config',
      body,
      headers: {
        Authorization: `Bearer ${dataDir}`
      }
    })
    expect(jason.success).to.be.true

    // Reload it and check the shop's DB config got updated.
    await shop.reload()
    expect(shop).to.be.an('object')
    expect(shop.hostname).to.startsWith(body.hostname)

    const config = getConfig(shop.config)
    expect(config.emailSubject).to.equal(body.emailSubject)

    // Check the admin activity was recorded.
    const adminLog = await AdminLog.findOne({ order: [['id', 'desc']] })
    expect(adminLog).to.be.an('object')
    expect(adminLog.shopId).to.equal(shop.id)
    expect(adminLog.sellerId).to.equal(1) // Shop was created using super admin with id 1.
    expect(adminLog.action).to.equal(AdminLogActions.ShopConfigUpdated)
    expect(adminLog.data).to.be.an('object')
    expect(adminLog.createdAt).to.be.a('date')

    const oldConfig = getConfig(adminLog.data.oldShop.config)
    expect(oldConfig).to.be.an('object')
    expect(oldConfig.emailSubject).to.equal(configBeforeUpdate.emailSubject)

    const diffKeys = adminLog.data.diffKeys
    const expectedDiffKeys = [
      'hostname', // because it was directly updated.
      'hasChanges', // because the shop DB row was updated.
      'updatedAt', // because the shop DB row was updated
      'config.dataUrl', // because the hostname was updated
      'config.emailSubject', // because it was directly updated
      'config.hostname', // because it was directly updated
      'config.publicUrl', // because the hostname was updated
      // Because the updateShopConfig method by default sets these to empty.
      'config.stripeBackend',
      'config.stripeWebhookSecret',
      'config.stripeWebhookHost'
    ]
    expect(diffKeys).to.deep.equal(expectedDiffKeys)
  })

  it('should deploy a shop', async () => {
    const testDomain = 'bugfreecode.ai'
    async function mockDeployFn(args) {
      return {
        ipfsHash: 'hash' + Date.now(), // Unique hash.
        ipfsPinner: TEST_IPFS_API,
        ipfsGateway: TEST_IPFS_GATEWAY,
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
    expect(deployment.ipfsPinner).to.equal(TEST_IPFS_API)
    expect(deployment.ipfsGateway).to.equal(TEST_IPFS_GATEWAY)
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
        ipfsPinner: TEST_IPFS_API,
        ipfsGateway: TEST_IPFS_GATEWAY,
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
    expect(newDeployment.ipfsPinner).to.equal(TEST_IPFS_API)
    expect(newDeployment.ipfsGateway).to.equal(TEST_IPFS_GATEWAY)
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

  it('createShopInDB should create a shop', async () => {
    const data = {
      networkId: 999,
      name: " Robinette's Shoop-2020 ",
      listingId: '999-001-' + Date.now(),
      authToken: 'token',
      config: setConfig({}),
      sellerId: 1,
      hostname: kebabCase('cool shoop hostname')
    }
    const resp = await createShopInDB(data)
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

  it('createShopInDB should refuse creating a shop with invalid arguments', async () => {
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
    let resp = await createShopInDB(data)
    expect(resp.error).to.be.a('string')

    // Shop with a non alphanumeric character in its name.
    data.name = '*bad shoop name'
    resp = await createShopInDB(data)
    expect(resp.error).to.be.a('string')

    // Shop with invalid listing ID
    data.name = 'good name'
    data.listingId = 'abcde'
    resp = await createShopInDB(data)
    expect(resp.error).to.be.a('string')

    // Shop with listing ID on incorrect network
    data.listingId = '1-001-1'
    resp = await createShopInDB(data)
    expect(resp.error).to.be.a('string')
  })
})
