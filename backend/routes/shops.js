const omit = require('lodash/omit')
const pick = require('lodash/pick')
const sortBy = require('lodash/sortBy')

const Stripe = require('stripe')
const {
  Seller,
  Shop,
  SellerShop,
  Network,
  ShopDeployment,
  ShopDeploymentName,
  Order,
  Sequelize
} = require('../models')
const {
  authSellerAndShop,
  authUser,
  authRole,
  authSuperUser
} = require('./_auth')
const { createSeller } = require('../utils/sellers')
const { getConfig, setConfig } = require('../utils/encryptedConfig')
const { createShop } = require('../utils/shop')
const genPGP = require('../utils/pgp')
const get = require('lodash/get')
const set = require('lodash/set')
const kebabCase = require('lodash/kebabCase')
const fs = require('fs')
const configs = require('../scripts/configs')
const { execFile } = require('child_process')
const formidable = require('formidable')
const https = require('https')
const http = require('http')
const mv = require('mv')
const { isHexPrefixed, addHexPrefix } = require('ethereumjs-util')

const { configureShopDNS, deployShop } = require('../utils/deployShop')
const { DSHOP_CACHE, IS_PROD } = require('../utils/const')
const { isPublicDNSName } = require('../utils/dns')
const { getLogger } = require('../utils/logger')
const {
  deregisterPrintfulWebhook,
  registerPrintfulWebhook
} = require('../utils/printful')

const printfulSyncProcessor = require('../queues/printfulSyncProcessor')

const log = getLogger('routes.shops')

const dayjs = require('dayjs')
const { readProductsFile } = require('../utils/products')

async function tryDataDir(dataDir) {
  const hasDir = fs.existsSync(`${DSHOP_CACHE}/${dataDir}`)
  const [authToken, hostname] = [dataDir, dataDir]
  const existingShopWithAuthToken = await Shop.findOne({ where: { authToken } })
  const existingShopWithHostname = await Shop.findOne({ where: { hostname } })
  return !existingShopWithAuthToken && !hasDir && !existingShopWithHostname
}

module.exports = function (router) {
  router.get(
    '/shop/users',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const users = await Seller.findAll({
        attributes: ['id', 'name', 'email', 'emailVerified'],
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
            ...user.get({ plain: true }),
            role: get(user, 'Shops[0].SellerShop.role')
          }
        })
      })
    }
  )

  router.get('/shop', async (req, res) => {
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

  router.post(
    '/shop/sync-printful',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const network = await Network.findOne({ where: { active: true } })
      if (!network) {
        return res.json({ success: false, reason: 'no-active-network' })
      }

      const { printful } = getConfig(req.shop.config)
      if (!printful) {
        return res.json({ success: false, reason: 'no-printful-api-key' })
      }

      const OutputDir = `${DSHOP_CACHE}/${req.shop.authToken}`

      await printfulSyncProcessor.processor({
        data: {
          OutputDir,
          apiKey: printful,
          shopId: req.shop.id
        },
        log: (data) => log.debug(data),
        progress: () => {}
      })

      res.json({ success: true })
    }
  )

  router.get('/shops/:shopId/deployments', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'no-such-shop' })
    }

    const deploymentResult = await ShopDeployment.findAll({
      where: { shopId: shop.id },
      include: [
        {
          model: ShopDeploymentName,
          as: 'names'
        }
      ],
      order: [['createdAt', 'desc']]
    })

    const deployments = deploymentResult.map((row) => ({
      ...pick(
        row.dataValues,
        'id',
        'shopId',
        'domain',
        'ipfsGateway',
        'ipfsHash',
        'createdAt',
        'updatedAt'
      ),
      domains: row.dataValues.names.map((nam) => nam.hostname)
    }))

    res.json({ deployments })
  })

  router.get('/shops/:shopId/assets', authSuperUser, async (req, res) => {
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

  router.delete('/shops/:shopId/assets', authSuperUser, async (req, res) => {
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

  router.post('/shops/:shopId/sync-cache', authSuperUser, async (req, res) => {
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

    log.info(`Downloading ${req.body.hash} from ${network.ipfs}`)
    const path = `/api/v0/get?arg=${req.body.hash}&archive=true&compress=true`

    // console.log(`curl -X POST ${network.ipfs}${path}`)

    await new Promise((resolve) => {
      const f = fs
        .createWriteStream(`${OutputDir}/data.tar.gz`)
        .on('finish', resolve)
      const fetchLib = network.ipfs.indexOf('https') === 0 ? https : http
      const hostname = network.ipfs.split('://')[1]

      const req = fetchLib.request({ hostname, path, method: 'POST' }, (res) =>
        res.pipe(f)
      )
      req.end()
    })

    await new Promise((resolve, reject) => {
      execFile('rm', ['-rf', `${OutputDir}/data`], (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      })
    })

    await new Promise((resolve, reject) => {
      execFile(
        'tar',
        ['-xvzf', `${OutputDir}/data.tar.gz`, '-C', OutputDir],
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
      execFile(
        'mv',
        [`${OutputDir}/${req.body.hash}/${dataDir}`, `${OutputDir}/data`],
        (error, stdout) => {
          if (error) reject(error)
          else resolve(stdout)
        }
      )
    })

    await new Promise((resolve, reject) => {
      execFile(
        'rm',
        ['-rf', `${OutputDir}/${req.body.hash}`],
        (error, stdout) => {
          if (error) reject(error)
          else resolve(stdout)
        }
      )
    })

    res.json({ success: true })
  })

  /**
   * Creates a new shop.
   */
  router.post('/shop', authUser, async (req, res) => {
    const { printfulApi } = req.body
    const shopType = req.body.shopType || 'empty'
    let originalDataDir = kebabCase(req.body.dataDir)
    let dataDir = kebabCase(req.body.dataDir)

    if (shopType !== 'local-dir') {
      // If dataDir already exists, try dataDir-1, dataDir-2 etc until it works
      let postfix = 1
      const existingPostfix = dataDir.match(/^(.*)-([0-9]+)$/)
      if (existingPostfix && existingPostfix[2]) {
        postfix = Number(existingPostfix[2])
        originalDataDir = existingPostfix[1]
      }
      if (postfix < 1) postfix = 1
      while (!(await tryDataDir(dataDir))) {
        postfix++
        dataDir = `${originalDataDir}-${postfix}`
      }
    }

    const OutputDir = `${DSHOP_CACHE}/${dataDir}`
    const hostname = dataDir

    const network = await Network.findOne({ where: { active: true } })
    const networkConfig = getConfig(network.config)
    const netAndVersion = `${network.networkId}-${network.marketplaceVersion}`

    if (req.body.listingId) {
      const existingShopWithListing = await Shop.findOne({
        where: { listingId: req.body.listingId }
      })
      if (existingShopWithListing) {
        return res.json({
          success: false,
          reason: 'invalid',
          field: 'listingId',
          message: 'Already exists'
        })
      }
      if (req.body.listingId.indexOf(netAndVersion) !== 0) {
        return res.json({
          success: false,
          reason: 'invalid',
          field: 'listingId',
          message: `Must start with ${netAndVersion}`
        })
      }
    }

    let name = req.body.name

    if (shopType === 'local-dir') {
      const existingData = fs
        .readFileSync(`${OutputDir}/data/config.json`)
        .toString()
      const json = JSON.parse(existingData)
      name = json.fullTitle || json.title
    }

    const zone = networkConfig.domain
    const backend = networkConfig.backendUrl
    const isLocal = zone === 'localhost'
    const publicUrl = isLocal ? backend : `https://${hostname}.${zone}`
    const dataUrl = `${publicUrl}/${dataDir}/`

    let defaultShopConfig = {}
    if (networkConfig.defaultShopConfig) {
      try {
        defaultShopConfig = JSON.parse(networkConfig.defaultShopConfig)
      } catch (e) {
        log.error('Error parsing default shop config')
      }
    }
    const pgpKeys = await genPGP()
    const config = {
      ...defaultShopConfig,
      ...pgpKeys,
      dataUrl,
      hostname,
      publicUrl,
      printful: req.body.printfulApi,
      deliveryApi: req.body.printfulApi ? true : false
    }
    if (req.body.web3Pk && !config.web3Pk) {
      config.web3Pk = isHexPrefixed(req.body.web3Pk)
        ? req.body.web3Pk
        : addHexPrefix(req.body.web3Pk)
    }
    const shopResponse = await createShop({
      networkId: network.networkId,
      sellerId: req.session.sellerId,
      listingId: req.body.listingId,
      hostname,
      name,
      authToken: dataDir,
      config: setConfig(config)
    })

    if (!shopResponse.shop) {
      log.error(`Error creating shop: ${shopResponse.error}`)
      return res
        .status(400)
        .json({ success: false, message: shopResponse.error })
    }

    const shopId = shopResponse.shop.id
    log.info(`Created shop ${shopId} with name ${shopResponse.name}`)

    const role = 'admin'
    await SellerShop.create({ sellerId: req.session.sellerId, shopId, role })
    log.info(`Added role OK`)

    if (shopType === 'blank' || shopType === 'local-dir') {
      return res.json({ success: true, slug: dataDir })
    }

    fs.mkdirSync(OutputDir, { recursive: true })
    log.info(`Outputting to ${OutputDir}`)

    if (shopType === 'printful' && printfulApi) {
      // Should this be made async? Like just moving to the queue instead of blocking?
      await printfulSyncProcessor.processor({
        data: {
          OutputDir,
          apiKey: printfulApi
        },
        log: (data) => log.debug(data),
        progress: () => {}
      })
    }

    let shopConfig = { ...configs.shopConfig }
    const existingConfig = fs.existsSync(`${OutputDir}/data/config.json`)
    if (existingConfig) {
      const config = fs.readFileSync(`${OutputDir}/data/config.json`).toString()
      shopConfig = JSON.parse(config)
    }

    log.info(`Shop type: ${shopType}`)
    const allowedTypes = [
      'single-product',
      'multi-product',
      'affiliate',
      'empty'
    ]

    if (allowedTypes.indexOf(shopType) >= 0) {
      const shopTpl = `${__dirname}/../db/shop-templates/${shopType}`
      const config = fs.readFileSync(`${shopTpl}/config.json`).toString()
      shopConfig = JSON.parse(config)
      await new Promise((resolve, reject) => {
        execFile(
          'cp',
          ['-r', shopTpl, `${OutputDir}/data`],
          (error, stdout) => {
            if (error) reject(error)
            else resolve(stdout)
          }
        )
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
        pgpPublicKey: pgpKeys.pgpPublicKey.replace(/\\r/g, '')
      }
    }

    const netPath = `networks[${network.networkId}]`
    shopConfig = set(shopConfig, `${netPath}.backend`, backend)
    if (req.body.listingId) {
      shopConfig = set(shopConfig, `${netPath}.listingId`, req.body.listingId)
    }

    const shopConfigPath = `${OutputDir}/data/config.json`
    fs.writeFileSync(shopConfigPath, JSON.stringify(shopConfig, null, 2))

    const shippingContent = JSON.stringify(configs.shipping, null, 2)
    fs.writeFileSync(`${OutputDir}/data/shipping.json`, shippingContent)

    return res.json({ success: true, slug: dataDir })
  })

  router.post(
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
              fs.stat(file.path, (err, fstat) => {
                if (err) return reject(err)
                if (!fstat.isFile()) {
                  return reject(`${file.path} does not exist or is not a file`)
                }

                mv(file.path, `${uploadDir}/${file.name}`, (err) => {
                  return err ? reject(err) : resolve()
                })
              })
            })
          }
          res.json({ success: true, fields, files })
        } catch (e) {
          log.error(e)
          res.json({ success: false })
        }
      })
    }
  )

  router.put(
    '/shop/assets',
    authSellerAndShop,
    authRole('admin'),
    async (req, res, next) => {
      const uploadDir = `${DSHOP_CACHE}/${req.shop.authToken}/data`

      if (!fs.existsSync(uploadDir)) {
        return res.json({ success: false, reason: 'dir-not-found' })
      }

      const form = formidable({ multiples: true })
      form.parse(req, async (err, fields, files) => {
        if (err) {
          next(err)
          return
        }

        if (!String(fields.type).match(/^(logo|favicon)$/)) {
          return res.json({ success: false, reason: 'invalid-type' })
        }

        const { file } = files
        if (!file) {
          return res.json({ success: false, reason: 'no-file' })
        }
        if (Array.isArray(file)) {
          return res.json({ success: false, reason: 'too-many-files' })
        }

        try {
          await new Promise((resolve, reject) => {
            fs.stat(file.path, (err, fstat) => {
              if (err) return reject(err)
              if (!fstat.isFile()) {
                return reject(`${file.path} does not exist or is not a file`)
              }

              mv(file.path, `${uploadDir}/${file.name}`, (err) => {
                return err ? reject(err) : resolve()
              })
            })
          })

          const raw = fs.readFileSync(`${uploadDir}/config.json`).toString()
          const config = JSON.parse(raw)
          config[fields.type] = file.name
          if (fields.type === 'logo') {
            config.title = ''
          }
          fs.writeFileSync(
            `${uploadDir}/config.json`,
            JSON.stringify(config, null, 2)
          )

          await req.shop.update({
            hasChanges: true
          })

          res.json({ success: true, path: file.name })
        } catch (e) {
          log.error(e)
          res.json({ success: false })
        }
      })
    }
  )

  router.put(
    '/shop/social-links',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const configFile = `${DSHOP_CACHE}/${req.shop.authToken}/data/config.json`

      if (!fs.existsSync(configFile)) {
        return res.json({ success: false, reason: 'dir-not-found' })
      }

      try {
        const raw = fs.readFileSync(configFile).toString()
        const config = JSON.parse(raw)

        fs.writeFileSync(
          configFile,
          JSON.stringify(
            {
              ...config,
              ...pick(req.body, [
                'facebook',
                'twitter',
                'instagram',
                'medium',
                'youtube'
              ])
            },
            null,
            2
          )
        )

        await req.shop.update({ hasChanges: true })

        res.json({ success: true })
      } catch (e) {
        log.error('Failed to update social links')
        res.json({ success: false })
      }
    }
  )

  async function deregisterStripeWebhooks(config) {
    const { stripeBackend, backendAuthToken } = config

    if (!stripeBackend || !backendAuthToken) {
      return
    }

    try {
      log.info('Trying to deregister any existing webhook...')
      const stripe = Stripe(stripeBackend)

      const webhookEndpoints = await stripe.webhookEndpoints.list({
        limit: 100
      })

      const endpointsToDelete = webhookEndpoints.data
        .filter(
          (endpoint) =>
            get(endpoint, 'metadata.dshopStore') === backendAuthToken
        )
        .map((endpoint) => endpoint.id)

      for (const endpointId of endpointsToDelete) {
        try {
          await stripe.webhookEndpoints.del(endpointId)
        } catch (err) {
          log.error('Failed to deregister webhook', endpointId, err)
        }
      }

      log.info(`${endpointsToDelete} webhooks deregisterd`)
    } catch (err) {
      log.error('Failed to deregister webhooks', err)
      return { success: false }
    }

    return { success: true }
  }

  async function registerStripeWebhooks(newConfig, oldConfig, backendUrl) {
    const { backendAuthToken } = oldConfig
    const { stripeBackend } = newConfig

    // Deregister old webhooks
    await deregisterStripeWebhooks(oldConfig)

    // NOTE: Fails on localhost, try using a reverse proxy/tunnel like ngrok
    // Or setup manually using Stripe CLI

    if (!backendUrl) {
      log.error('Invalid webhook host')
      return { success: false }
    }

    log.info('Trying to register webhook on host', backendUrl)

    try {
      const stripe = Stripe(stripeBackend)

      const endpoint = await stripe.webhookEndpoints.create({
        url: `${backendUrl}/webhook`,
        enabled_events: ['payment_intent.succeeded'],
        description: 'Origin Dshop payment processor',
        metadata: {
          dshopStore: backendAuthToken
        }
      })

      log.info(`Registered webhook for host ${backendUrl}`)

      return { success: true, secret: endpoint.secret }
    } catch (err) {
      console.error('Failed to register webhooks', err)
      return { success: false }
    }
  }

  router.put(
    '/shop/config',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const jsonConfig = pick(
        req.body,
        'metaDescription',
        'css',
        'emailSubject',
        'cartSummaryNote',
        'byline',
        'discountCodes',
        'stripe',
        'stripeKey',
        'acceptedTokens',
        'title',
        'fullTitle',
        'facebook',
        'twitter',
        'instagram',
        'medium',
        'youtube',
        'about',
        'logErrors'
      )
      const shopId = req.shop.id
      log.info(`Shop ${shopId} - Saving config`)

      let listingId
      if (String(req.body.listingId).match(/^[0-9]+-[0-9]+-[0-9]+$/)) {
        listingId = req.body.listingId
        req.shop.listingId = listingId
      }

      if (Object.keys(jsonConfig).length || listingId) {
        const configFile = `${DSHOP_CACHE}/${req.shop.authToken}/data/config.json`

        if (!fs.existsSync(configFile)) {
          return res.json({ success: false, reason: 'dir-not-found' })
        }

        try {
          const raw = fs.readFileSync(configFile).toString()
          const config = JSON.parse(raw)
          const newConfig = { ...config, ...jsonConfig }
          if (listingId) {
            const [netId] = listingId.split('-')
            set(newConfig, `networks.${netId}.listingId`, listingId)
          }
          const jsonStr = JSON.stringify(newConfig, null, 2)
          fs.writeFileSync(configFile, jsonStr)
        } catch (e) {
          log.error(e)
          return res.json({ success: false })
        }
      }

      if (req.body.about) {
        // Update about file
        const dataDir = `${DSHOP_CACHE}/${req.shop.authToken}/data`
        const aboutFile = `${dataDir}/${req.body.about}`

        try {
          fs.writeFileSync(aboutFile, req.body.aboutText)
        } catch (e) {
          log.error('Failed to update about file', dataDir, aboutFile, e)
          return res.json({ success: false })
        }
      }

      // Check the hostname picked by the merchant is available.
      const existingConfig = getConfig(req.shop.config)
      if (req.body.hostname) {
        const hostname = kebabCase(req.body.hostname)
        const existingShops = await Shop.findAll({
          where: { hostname, [Sequelize.Op.not]: { id: shopId } }
        })
        if (existingShops.length) {
          return res.json({
            success: false,
            reason: 'Name unavailable',
            field: 'hostname'
          })
        }
        req.shop.hostname = hostname
      }
      if (req.body.fullTitle) {
        req.shop.name = req.body.fullTitle
      }

      // Load the network config.
      const network = await Network.findOne({ where: { active: true } })
      const netConfig = getConfig(network.config)

      const additionalOpts = {}

      // Configure Stripe webhooks
      if (IS_PROD) {
        // Register webhooks only on prod
        if (req.body.stripe === false) {
          log.info(`Shop ${shopId} - Deregistering Stripe webhook`)
          await deregisterStripeWebhooks(existingConfig)
          additionalOpts.stripeWebhookSecret = ''
          additionalOpts.stripeBackend = ''
        } else if (req.body.stripe && !req.body.stripeWebhookSecret) {
          log.info(`Shop ${shopId} - Registering Stripe webhook`)
          const { secret } = await registerStripeWebhooks(
            req.body,
            existingConfig,
            netConfig.backendUrl
          )
          additionalOpts.stripeWebhookSecret = secret
        } else if (req.body.stripeWebhookSecret) {
          additionalOpts.stripeWebhookSecret = req.body.stripeWebhookSecret
        }
      } else {
        additionalOpts.stripeWebhookSecret = req.body.stripeWebhookSecret
      }

      // Configure Printful webhooks
      if (req.body.printful) {
        log.info(`Shop ${shopId} - Registering Printful webhook`)
        const printfulWebhookSecret = await registerPrintfulWebhook(
          shopId,
          {
            ...existingConfig,
            ...req.body
          },
          netConfig.backendUrl
        )

        additionalOpts.printfulWebhookSecret = printfulWebhookSecret
      } else if (existingConfig.printful && !req.body.printful) {
        log.info(`Shop ${shopId} - Deregistering Printful webhook`)
        await deregisterPrintfulWebhook(shopId, existingConfig)
        additionalOpts.printfulWebhookSecret = ''
      }

      // Save the config in the DB.
      log.info(`Shop ${shopId} - Saving config in the DB.`)
      const newConfig = setConfig(
        { ...existingConfig, ...req.body, ...additionalOpts },
        req.shop.config
      )
      req.shop.config = newConfig
      req.shop.hasChanges = true
      await req.shop.save()
      return res.json({ success: true })
    }
  )

  router.post(
    '/shop/add-user',
    authSellerAndShop,
    authRole('admin'),
    async (req, res, next) => {
      const shopId = req.shop.id
      if (!req.body.email) {
        return res.json({ success: false, message: 'No email specified' })
      }

      const { role } = req.body
      const email = req.body.email.toLowerCase()
      const existingSeller = await Seller.findOne({ where: { email } })
      if (existingSeller) {
        SellerShop.upsert({ sellerId: existingSeller.id, shopId, role })
          .then(() => {
            res.json({ success: true, sellerExists: true })
          })
          .catch((err) => {
            log.error(err)
            next(err)
          })

        return
      }

      const { seller, status, error } = await createSeller(req.body, { shopId })

      if (error) {
        return res.status(status).json({ success: false, message: error })
      }

      if (!seller) {
        return res.json({ success: false })
      }

      SellerShop.create({ sellerId: seller.id, shopId, role })
        .then(() => {
          res.json({ success: true })
        })
        .catch((err) => {
          log.error(err)
          next(err)
        })
    }
  )

  router.delete('/shops/:shopId', authSuperUser, async (req, res) => {
    try {
      const shop = await Shop.findOne({
        where: { authToken: req.params.shopId }
      })

      await ShopDeployment.destroy({ where: { shopId: shop.id } })
      await Shop.destroy({ where: { authToken: req.params.shopId } })

      if (req.body.deleteCache) {
        await new Promise((resolve, reject) => {
          execFile(
            'rm',
            ['-rf', `${DSHOP_CACHE}/${shop.authToken}`],
            (error, stdout) => {
              if (error) reject(error)
              else resolve(stdout)
            }
          )
        })
      }

      res.json({ success: true })
    } catch (err) {
      res.json({ success: false, reason: err.toString() })
    }
  })

  /**
   * Called by super-admin for deploying a shop.
   */
  router.post('/shops/:shopId/deploy', authSuperUser, async (req, res) => {
    const shop = await Shop.findOne({ where: { authToken: req.params.shopId } })
    if (!shop) {
      return res.json({ success: false, reason: 'shop-not-found' })
    }
    const { networkId } = req.body
    const network = await Network.findOne({ where: { networkId } })
    if (!network) {
      return res.json({ success: false, reason: 'no-such-network' })
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

      const start = +new Date()

      const { hash, domain } = await deployShop(deployOpts)

      const end = +new Date()
      const deployTimeSeconds = Math.floor((end - start) / 1000)
      log.info(
        `Deploy duration (shop_id: ${req.params.shopId}): ${deployTimeSeconds}s`
      )

      return res.json({ success: true, hash, domain, gateway: network.ipfs })
    } catch (e) {
      log.error(`Shop ${shop.id} deploy failed: ${e}`)
      return res.json({ success: false, reason: e.message })
    }
  })

  /**
   * Called by admin for deploying a shop.
   */
  router.post(
    '/shop/deploy',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      if (!req.shop.hostname) {
        return res.json({ success: false, reason: 'no-hostname-configured' })
      }

      let where = { active: true }
      if (req.seller.superuser && req.body.networkId) {
        where = { networkId: req.body.networkId }
      }
      const network = await Network.findOne({ where })
      if (!network) {
        return res.json({ success: false, reason: 'no-active-network' })
      }
      const networkConfig = getConfig(network.config)

      const dataDir = req.shop.authToken
      const OutputDir = `${DSHOP_CACHE}/${dataDir}`

      let pinner, dnsProvider

      // If both an IPFS cluster and Pinata are configured,
      // we favor pinning on the IPFS cluster.
      if (network.ipfsApi && networkConfig.ipfsClusterPassword) {
        pinner = 'ipfs-cluster'
      } else if (networkConfig.pinataKey) {
        pinner = 'pinata'
      }
      if (!pinner && network.ipfsApi.indexOf('http://localhost') < 0) {
        return res.json({ success: false, reason: 'no-pinner-configured' })
      }

      if (networkConfig.gcpCredentials) {
        dnsProvider = 'gcp'
      } else if (networkConfig.cloudflareApiKey) {
        dnsProvider = 'cloudflare'
      }

      try {
        const deployOpts = {
          OutputDir,
          dataDir,
          network,
          subdomain: req.shop.hostname,
          shop: req.shop,
          pinner,
          dnsProvider
        }

        const start = +new Date()

        const { hash, domain } = await deployShop(deployOpts)

        await req.shop.update({
          hasChanges: false
        })

        const end = +new Date()
        const deployTimeSeconds = Math.floor((end - start) / 1000)
        log.info(
          `Deploy duration (shop_id: ${req.shop.id}): ${deployTimeSeconds}s`
        )

        return res.json({ success: true, hash, domain, gateway: network.ipfs })
      } catch (e) {
        log.error(`Shop ${req.shop.id} initial deploy failed: ${e}`)
        return res.json({ success: false, reason: e.message })
      }
    }
  )

  router.get(
    '/shop/deployments',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const deploymentResult = await ShopDeployment.findAll({
        where: { shopId: req.shop.id },
        include: [
          {
            model: ShopDeploymentName,
            as: 'names'
          }
        ],
        order: [['createdAt', 'desc']]
      })

      const deployments = deploymentResult.map((row) => ({
        ...pick(
          row.dataValues,
          'id',
          'shopId',
          'domain',
          'ipfsPinner',
          'ipfsGateway',
          'ipfsHash',
          'createdAt',
          'updatedAt'
        ),
        domains: row.dataValues.names.map((nam) => nam.hostname)
      }))

      res.json({ success: true, deployments })
    }
  )

  /**
   * Get names (DNS names, crypto names, etc) for a shop
   */
  router.get(
    '/shops/:shopId/get-names',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const names = await ShopDeploymentName.findAll({
        include: [
          {
            model: ShopDeployment,
            as: 'shopDeployments',
            where: {
              shopId: req.shop.id
            }
          }
        ],
        order: [['createdAt', 'desc']]
      })

      if (!names) {
        return res.status(404).json({ success: false })
      }

      return res.json({
        success: true,
        names: names.reduce((acc, nam) => {
          if (!acc.includes(nam.hostname)) {
            acc.push(nam.hostname)
          }
          return acc
        }, [])
      })
    }
  )

  /**
   * Set names (DNS names, crypto names, etc) for a shop deployment
   */
  router.post(
    '/shops/:shopId/set-names',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { ipfsHash, hostnames, dnsProvider } = req.body

      if (!ipfsHash || !hostnames) {
        return res.status(400).json({ success: false })
      }

      const deployment = await ShopDeployment.findOne({
        where: {
          shopId: req.shop.id,
          ipfsHash
        },
        order: [['createdAt', 'desc']]
      })

      if (!deployment) {
        return res.status(404).json({ success: false })
      }

      for (const fqn of hostnames) {
        const parts = fqn.split('.')
        const hostname = parts.shift()
        const zone = parts.join('.')
        if (isPublicDNSName(fqn)) {
          if (!dnsProvider) {
            return res.status(400).json({
              success: false,
              message: `No DNS provider selected for public DNS name ${fqn}`
            })
          }

          const network = await Network.findOne({ where: { active: true } })
          await configureShopDNS({
            network,
            subdomain: hostname,
            hostname: zone,
            hash: ipfsHash,
            dnsProvider
          })
        }

        log.info(`Adding ${fqn} association to ${ipfsHash}`)
        await ShopDeploymentName.create({
          ipfsHash,
          hostname: fqn
        })
      }

      await req.shop.update({
        hasChanges: true
      })

      return res.json({ success: true, ipfsHash, names: hostnames })
    }
  )

  const getConstraintForRange = (range) => {
    const { Op } = Sequelize

    const startOfDay = dayjs().startOf('day')
    const endOfDay = dayjs().endOf('day')

    let startDate, endDate

    switch (range) {
      case '30-days':
        startDate = startOfDay.subtract(30, 'days')
        endDate = endOfDay
        break

      case '7-days':
        startDate = startOfDay.subtract(7, 'days')
        endDate = endOfDay
        break

      case 'yesterday':
        startDate = startOfDay.subtract(1, 'days')
        endDate = endOfDay.subtract(1, 'days')
        break

      case 'today':
        startDate = startOfDay
        endDate = endOfDay
        break
    }

    if (!startDate || !endDate) return {}

    return {
      [Op.and]: [
        { createdAt: { [Op.gte]: startDate.toDate() } },
        { createdAt: { [Op.lt]: endDate.toDate() } }
      ]
    }
  }

  router.get('/dashboard-stats', authSellerAndShop, async (req, res) => {
    const shop = req.shop
    const { range, sort } = req.query

    const orders = await Order.findAll({
      where: {
        shopId: shop.id,
        ...getConstraintForRange(range)
      }
    })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.data.total,
      0
    )

    const products = readProductsFile(shop)

    const topProductsRaw = orders
      .reduce((items, order) => [...items, ...order.data.items], [])
      .filter((item) => item)
      .reduce((m, o) => {
        m[o.product] = m[o.product] || { revenue: 0, orders: 0 }
        m[o.product].orders += o.quantity
        m[o.product].revenue += o.price * o.quantity
        return m
      }, {})

    const topProducts = sortBy(
      Object.entries(topProductsRaw),
      (o) => -o[1][sort]
    )
      .slice(0, 10)
      .map(([productId, stats]) => {
        const product = products.find((p) => p.id === productId)
        return product ? { ...product, ...stats } : null
      })
      .filter((p) => p)

    res.send({
      success: true,
      totalOrders,
      totalRevenue,
      orders,
      topProducts
    })
  })
}
