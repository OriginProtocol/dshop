const omit = require('lodash/omit')
const {
  Seller,
  Shop,
  SellerShop,
  Network,
  Sequelize,
  ShopDeployment
} = require('../models')
const { authSellerAndShop, authRole, authSuperUser } = require('./_auth')
const { createSeller } = require('../utils/sellers')
const { getConfig, setConfig } = require('../utils/encryptedConfig')
const { createShop } = require('../utils/shop')
const get = require('lodash/get')
const set = require('lodash/set')
const fs = require('fs')
const configs = require('../scripts/configs')
const { exec } = require('child_process')
const formidable = require('formidable')
const https = require('https')
const http = require('http')
const mv = require('mv')

const { deployShop } = require('../utils/deployShop')
const { DSHOP_CACHE } = require('../utils/const')

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

  app.post('/shops/:shopId/sync-printful', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'no-such-shop' })
    }

    const network = await Network.findOne({ where: { active: true } })
    if (!network) {
      return res.json({ success: false, reason: 'no-active-network' })
    }

    const { printful } = getConfig(shop.config)
    if (!printful) {
      return res.json({ success: false, reason: 'no-printful-api-key' })
    }

    const OutputDir = `${DSHOP_CACHE}/${shop.authToken}`

    await downloadProductData({ OutputDir, printfulApi: printful })
    await writeProductData({ OutputDir })
    await downloadPrintfulMockups({ OutputDir })
    await resizePrintfulMockups({ OutputDir })

    res.json({ success: true })
  })

  app.get('/shops/:shopId/deployments', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'no-such-shop' })
    }

    const deployments = await ShopDeployment.findAll({
      where: { shopId: shop.id },
      order: [['createdAt', 'desc']]
    })

    res.json({ deployments })
  })

  app.get('/shops/:shopId/assets', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'no-such-shop' })
    }

    const OutputDir = `${DSHOP_CACHE}/${shop.authToken}/data`
    fs.readdir(OutputDir, (err, files) => {
      res.json({
        assets: err ? [] : files.filter((f) => f.match(/\.(png|svg|jpg|ico)$/))
      })
    })
  })

  app.delete('/shops/:shopId/assets', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'no-such-shop' })
    }
    if (!req.body.file) {
      return res.json({ success: false, reason: 'no-file-specified' })
    }

    const file = `${DSHOP_CACHE}/${shop.authToken}/data/${req.body.file}`
    if (!file) {
      return res.json({ success: false, reason: 'no-such-file' })
    }

    fs.unlink(file, (err) => {
      res.json({ success: err ? false : true })
    })
  })

  app.post('/shops/:shopId/sync-cache', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'no-such-shop' })
    }
    if (!req.body.hash) {
      return res.json({ success: false, reason: 'no-hash-specified' })
    }

    const network = await Network.findOne({
      where: { networkId: req.body.networkId }
    })
    if (!network.ipfsApi) {
      return res.json({ success: false, reason: 'no-ipfs-api' })
    }

    const OutputDir = `${DSHOP_CACHE}/${shop.authToken}`

    fs.mkdirSync(OutputDir, { recursive: true })
    console.log(`Downloading ${req.body.hash} from ${network.ipfsApi}`)
    const path = `/api/v0/get?arg=${req.body.hash}&archive=true&compress=true`

    await new Promise((resolve) => {
      const f = fs
        .createWriteStream(`${OutputDir}/data.tar.gz`)
        .on('finish', resolve)
      const fetchLib = network.ipfsApi.indexOf('https') === 0 ? https : http
      const hostname = network.ipfsApi.split('://')[1]

      const req = fetchLib.request({ hostname, path, method: 'POST' }, (res) =>
        res.pipe(f)
      )
      req.end()
    })

    await new Promise((resolve, reject) => {
      exec(`rm -rf ${OutputDir}/data`, (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      })
    })

    await new Promise((resolve, reject) => {
      exec(
        `tar -xvzf ${OutputDir}/data.tar.gz -C ${OutputDir}`,
        (error, stdout) => {
          if (error) reject(error)
          else resolve(stdout)
        }
      )
    })

    fs.unlinkSync(`${OutputDir}/data.tar.gz`)

    const indexRaw = fs.readFileSync(`${OutputDir}/${req.body.hash}/index.html`)
    const match = indexRaw
      .toString()
      .match(/rel="data-dir" href="([0-9a-z-]+)"/)
    const dataDir = match[1]

    await new Promise((resolve, reject) => {
      exec(
        `mv ${OutputDir}/${req.body.hash}/${dataDir} ${OutputDir}/data`,
        (error, stdout) => {
          if (error) reject(error)
          else resolve(stdout)
        }
      )
    })

    await new Promise((resolve, reject) => {
      exec(`rm -rf ${OutputDir}/${req.body.hash}`, (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      })
    })

    res.json({ success: true })
  })

  /**
   * Creates a new shop.
   */
  app.post('/shop', authSuperUser, async (req, res) => {
    const { dataDir, pgpPublicKey, printfulApi, shopType, backend } = req.body
    const OutputDir = `${DSHOP_CACHE}/${dataDir}`

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

    let defaultShopConfig = {}
    if (networkConfig.defaultShopConfig) {
      try {
        defaultShopConfig = JSON.parse(networkConfig.defaultShopConfig)
      } catch (e) {
        console.log('Error parsing default shop config')
      }
    }
    const config = {
      ...defaultShopConfig,
      dataUrl,
      publicUrl,
      printful: req.body.printfulApi,
      deliveryApi: req.body.printfulApi ? true : false,
      pgpPublicKey: req.body.pgpPublicKey,
      pgpPrivateKey: req.body.pgpPrivateKey,
      pgpPrivateKeyPass: req.body.pgpPrivateKeyPass
    }
    if (req.body.web3Pk && !config.web3Pk) {
      config.web3Pk = req.body.web3Pk
    }
    const shopResponse = await createShop({
      sellerId: req.session.sellerId,
      listingId: req.body.listingId,
      name,
      authToken: req.body.dataDir,
      config: setConfig(config)
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

  app.post(
    '/shops/:shopId/save-files',
    authSuperUser,
    async (req, res, next) => {
      const shop = await Shop.findOne({
        where: { authToken: req.params.shopId }
      })
      if (!shop) {
        return res.json({ success: false, reason: 'shop-not-found' })
      }

      const dataDir = req.params.shopId
      const uploadDir = `${DSHOP_CACHE}/${dataDir}/data`

      if (!fs.existsSync(uploadDir)) {
        return res.json({ success: false, reason: 'dir-not-found' })
      }

      const form = formidable({ multiples: true })

      form.parse(req, async (err, fields, files) => {
        if (err) {
          next(err)
          return
        }
        const allFiles = Array.isArray(files.file) ? files.file : [files.file]
        try {
          for (const file of allFiles) {
            await new Promise((resolve, reject) => {
              mv(file.path, `${uploadDir}/${file.name}`, (err) => {
                return err ? reject(err) : resolve()
              })
            })
          }
          res.json({ fields, files })
        } catch (e) {
          console.log(e)
          res.json({ success: false })
        }
      })
    }
  )

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
    const OutputDir = `${DSHOP_CACHE}/${dataDir}`

    try {
      const deployOpts = {
        OutputDir,
        dataDir,
        network,
        subdomain: dataDir,
        shop,
        pinner: req.body.pinner,
        dnsProvider: req.body.dnsProvider
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

  app.delete('/shops/:shopId', authSuperUser, async (req, res) => {
    try {
      const shop = await Shop.findOne({
        where: { authToken: req.params.shopId }
      })

      await ShopDeployment.destroy({ where: { shopId: shop.id } })
      await Shop.destroy({ where: { authToken: req.params.shopId } })

      if (req.body.deleteCache) {
        await new Promise((resolve, reject) => {
          exec(`rm -rf ${DSHOP_CACHE}/${shop.authToken}`, (error, stdout) => {
            if (error) reject(error)
            else resolve(stdout)
          })
        })
      }

      res.json({ success: true })
    } catch (err) {
      res.json({ success: false, reason: err.toString() })
    }
  })
}
