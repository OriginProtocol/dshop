const omit = require('lodash/omit')
const { Seller, Shop, SellerShop, Network, Sequelize } = require('../models')
const { authSellerAndShop, authRole, authSuperUser } = require('./_auth')
const { createSeller } = require('../utils/sellers')
const { getConfig, setConfig } = require('../utils/encryptedConfig')
const { createShop } = require('../utils/shop')
const get = require('lodash/get')
const set = require('lodash/set')
const fs = require('fs')
const configs = require('../scripts/configs')
const { exec } = require('child_process')

const { deployShop } = require('../utils/deployShop')

const downloadProductData = require('../scripts/printful/downloadProductData')
const downloadPrintfulMockups = require('../scripts/printful/downloadPrintfulMockups')
const resizePrintfulMockups = require('../scripts/printful/resizePrintfulMockups')
const writeProductData = require('../scripts/printful/writeProductData')

module.exports = function (app) {
  app.get(
    '/shop/users',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const users = await Seller.findAll({
        attributes: ['id', 'name', 'email'],
        include: {
          model: Shop,
          attributes: ['id'],
          through: { attributes: ['role'] },
          where: { id: req.shop.id }
        }
      })

      res.json({
        success: true,
        users: users.map((user) => {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: get(user, 'Shops[0].SellerShop.role')
          }
        })
      })
    }
  )

  app.get('/shop', async (req, res) => {
    const { sellerId } = req.session

    if (!sellerId) {
      return res.status(400).json({ success: false })
    }

    const rows = await Shop.findAll({ where: { sellerId } })

    const shops = []
    for (const row of rows) {
      const shopConfig = getConfig(row.dataValues.config)
      shops.push({
        ...omit(row.dataValues, ['config', 'sellerId']),
        dataUrl: shopConfig.dataUrl
      })
    }

    res.json({ success: true, shops })
  })

  app.post(
    '/shop/sync-printful',
    authSuperUser,
    authSellerAndShop,
    async (req, res) => {
      const shop = req.shop
      const network = await Network.findOne({ where: { active: true } })
      if (!network) {
        return res.json({ success: false, reason: 'no-active-network' })
      }

      const { printful } = getConfig(shop.config)
      if (!printful) {
        return res.json({ success: false, reason: 'no-printful-api-key' })
      }

      const OutputDir = `${__dirname}/../data/${shop.authToken}`

      await downloadProductData({ OutputDir, printfulApi: printful })
      await writeProductData({ OutputDir })
      await downloadPrintfulMockups({ OutputDir })
      await resizePrintfulMockups({ OutputDir })

      res.json({ success: true })
    }
  )

  /**
   * Creates a new shop.
   */
  app.post('/shop', authSuperUser, async (req, res) => {
    const { dataDir, pgpPublicKey, printfulApi, shopType, backend } = req.body
    const OutputDir = `${__dirname}/../data/${dataDir}`

    if (fs.existsSync(OutputDir) && req.body.shopType !== 'local-dir') {
      return res.json({
        success: false,
        reason: 'invalid',
        field: 'dataDir',
        message: 'Already exists'
      })
    }

    const existingShop = await Shop.findOne({
      where: {
        [Sequelize.Op.or]: [
          { listingId: req.body.listingId },
          { authToken: req.body.dataDir }
        ]
      }
    })

    if (existingShop) {
      const field =
        existingShop.listingId === req.body.listingId ? 'listingId' : 'dataDir'
      return res.json({
        success: false,
        reason: 'invalid',
        field,
        message: 'Already exists'
      })
    }

    const network = await Network.findOne({ where: { active: true } })
    const networkConfig = getConfig(network.config)
    const netAndVersion = `${network.networkId}-${network.marketplaceVersion}`
    if (req.body.listingId.indexOf(netAndVersion) !== 0) {
      return res.json({
        success: false,
        reason: 'invalid',
        field: 'listingId',
        message: `Must start with ${netAndVersion}`
      })
    }

    let name = req.body.name

    if (req.body.shopType === 'local-dir') {
      const existingData = fs
        .readFileSync(`${OutputDir}/data/config.json`)
        .toString()
      const json = JSON.parse(existingData)
      name = json.fullTitle || json.title
    }

    const zone = networkConfig.domain
    const subdomain = req.body.hostname
    const isLocal = zone === 'localhost'
    const publicUrl = isLocal ? backend : `https://${subdomain}.${zone}`
    const dataUrl = `${publicUrl}/${req.body.dataDir}/`

    const shopResponse = await createShop({
      sellerId: req.session.sellerId,
      listingId: req.body.listingId,
      name,
      authToken: req.body.dataDir,
      config: setConfig({
        dataUrl,
        publicUrl,
        printful: req.body.printfulApi,
        stripeBackend: '',
        stripeWebhookSecret: '',
        pgpPublicKey: req.body.pgpPublicKey,
        pgpPrivateKey: req.body.pgpPrivateKey,
        pgpPrivateKeyPass: req.body.pgpPrivateKeyPass,
        web3Pk: req.body.web3Pk
      })
    })

    if (!shopResponse.shop) {
      console.log(`Error creating shop: ${shopResponse.error}`)
      return res
        .status(400)
        .json({ success: false, message: 'Invalid shop data' })
    }

    const shopId = shopResponse.shop.id
    console.log(`Created shop ${shopId}`)

    const role = 'admin'
    await SellerShop.create({ sellerId: req.session.sellerId, shopId, role })
    console.log(`Added role OK`)

    if (shopType === 'blank' || shopType === 'local-dir') {
      return res.json({ success: true })
    }

    fs.mkdirSync(OutputDir, { recursive: true })
    console.log(`Outputting to ${OutputDir}`)

    if (shopType === 'printful' && printfulApi) {
      await downloadProductData({ OutputDir, printfulApi })
      await writeProductData({ OutputDir })
      await downloadPrintfulMockups({ OutputDir })
      await resizePrintfulMockups({ OutputDir })
    }

    let shopConfig = { ...configs.shopConfig }
    const existingConfig = fs.existsSync(`${OutputDir}/data/config.json`)
    if (existingConfig) {
      const config = fs.readFileSync(`${OutputDir}/data/config.json`).toString()
      shopConfig = JSON.parse(config)
    }

    console.log(`Shop type: ${shopType}`)
    const allowedTypes = ['single-product', 'multi-product', 'affiliate']

    if (allowedTypes.indexOf(shopType) >= 0) {
      const shopTpl = `${__dirname}/../db/shop-templates/${shopType}`
      const config = fs.readFileSync(`${shopTpl}/config.json`).toString()
      shopConfig = JSON.parse(config)
      await new Promise((resolve, reject) => {
        exec(`cp -r ${shopTpl} ${OutputDir}/data`, (error, stdout) => {
          if (error) reject(error)
          else resolve(stdout)
        })
      })
    }

    if (!existingConfig) {
      shopConfig = {
        ...shopConfig,
        title: name,
        fullTitle: name,
        backendAuthToken: dataDir,
        supportEmail: `${name} Store <${dataDir}@ogn.app>`,
        emailSubject: `Your ${name} Order`,
        pgpPublicKey: pgpPublicKey.replace(/\\r/g, '')
      }
    }

    const netPath = `networks[${network.networkId}]`
    shopConfig = set(shopConfig, `${netPath}.backend`, req.body.backend)
    shopConfig = set(shopConfig, `${netPath}.listingId`, req.body.listingId)

    const shopConfigPath = `${OutputDir}/data/config.json`
    fs.writeFileSync(shopConfigPath, JSON.stringify(shopConfig, null, 2))

    const shippingContent = JSON.stringify(configs.shipping, null, 2)
    fs.writeFileSync(`${OutputDir}/data/shipping.json`, shippingContent)

    try {
      const deployOpts = {
        OutputDir,
        dataDir,
        network,
        subdomain,
        shop: shopResponse.shop
      }
      const { hash, domain } = await deployShop(deployOpts)
      return res.json({ success: true, hash, domain, gateway: network.ipfs })
    } catch (e) {
      return res.json({ success: false, reason: e.message })
    }
  })

  app.post('/shops/:shopId/deploy', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'shop-not-found' })
    }
    const network = await Network.findOne({
      where: { networkId: req.body.networkId }
    })
    if (!network) {
      return res.json({ success: false, reason: 'no-active-network' })
    }

    const dataDir = req.params.shopId
    const OutputDir = `${__dirname}/../data/${dataDir}`

    try {
      const deployOpts = {
        OutputDir,
        dataDir,
        network,
        subdomain: dataDir,
        shop
      }
      const { hash, domain } = await deployShop(deployOpts)
      return res.json({ success: true, hash, domain, gateway: network.ipfs })
    } catch (e) {
      return res.json({ success: false, reason: e.message })
    }
  })

  app.post(
    '/shop/add-user',
    authSellerAndShop,
    authRole('admin'),
    async (req, res, next) => {
      const { seller, status, error } = await createSeller(req.body)

      if (error) {
        return res.status(status).json({ success: false, message: error })
      }

      if (!seller) {
        return res.json({ success: false })
      }

      SellerShop.create({
        sellerId: seller.id,
        shopId: req.shop.id,
        role: req.body.role
      })
        .then(() => {
          res.json({ success: true })
        })
        .catch((err) => {
          console.error(err)
          next(err)
        })
    }
  )

  app.delete('/shops/:shopId', authSuperUser, (req, res) => {
    Shop.destroy({ where: { authToken: req.params.shopId } }).then(() => {
      res.json({ success: true })
    })
  })
}
