const ethers = require('ethers')
const fs = require('fs')
const { pick, sortBy, get } = require('lodash')
const { execFile } = require('child_process')
const formidable = require('formidable')
const https = require('https')
const http = require('http')
const mv = require('mv')
const dayjs = require('dayjs')

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
const { getConfig } = require('../utils/encryptedConfig')
const { configureShopDNS, deployShop } = require('../utils/deployShop')
const { DSHOP_CACHE } = require('../utils/const')
const { isPublicDNSName } = require('../utils/dns')
const { getLogger } = require('../utils/logger')
const { readProductsFile } = require('../utils/products')
const printfulSyncProcessor = require('../queues/printfulSyncProcessor')
const { updateShopConfig } = require('../logic/shop/config')
const { createShop } = require('../logic/shop/create')

const log = getLogger('routes.shops')

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

  router.get('/shop', authSuperUser, async (req, res) => {
    res.send({
      success: true,
      shop: await Shop.findOne({
        where: {
          authToken: req.query.shopToken
        }
      })
    })
  })

  router.get('/shops', authUser, async (req, res) => {
    const user = req.seller
    const order = [['id', 'desc']]
    const attributes = [
      'id',
      'name',
      'authToken',
      'hostname',
      'listingId',
      'createdAt',
      'hasChanges',
      'networkId'
    ]
    const include = { model: Seller, where: { id: user.id } }
    const limit = 10
    const { page: pageVal, search } = req.query
    const page = parseInt(pageVal) || 1
    const offset = page ? (page - 1) * limit : undefined
    let where = {}

    if (req.query.search) {
      where = Sequelize.where(
        Sequelize.fn('lower', Sequelize.col('name')),
        Sequelize.Op.like,
        `%${search.toLowerCase()}%`
      )
    }

    let shops = [],
      count
    if (user.superuser) {
      const allShops = await Shop.findAll({ order, limit, where, offset })
      count = await Shop.count({ where })
      shops = allShops.map((s) => ({
        ...pick(s.dataValues, attributes),
        role: 'admin'
      }))
    } else {
      const allShops = await Shop.findAll({
        attributes,
        include,
        order,
        limit,
        where,
        offset
      })
      count = await Shop.count({ include, where })
      shops = allShops.map((s) => ({
        ...pick(s.dataValues, attributes),
        role: get(s, 'Sellers[0].SellerShop.dataValues.role')
      }))
    }

    shops = shops.map((s) => {
      const configPath = `${DSHOP_CACHE}/${s.authToken}/data/config.json`
      const viewable = fs.existsSync(configPath)
      return { ...s, viewable }
    })

    res.json({
      success: true,
      shops,
      pagination: {
        numPages: Math.ceil(count / limit),
        totalCount: count,
        perPage: limit
      }
    })
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
          shopId: req.shop.id,
          refreshImages: req.body.refreshImages ? true : false
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

    log.info(`curl -X POST "${network.ipfs}${path}"`)

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
   *
   * The following fields from req.body are used:
   * @param {string} name: Name of the store.
   * @param {string} dataDir: Seed data dir. This is usually set to the shop's name.
   * @param {string} supportEmail: Optional. Shop's support email.
   * @param {string} web3Pk: Optional. Web3 private key for recording orders as offers on the marketplace.
   *   Only necessary when the system operates in on-chain mode.
   * @param {string} listingId: Optional. Marketplace listingId.
   *   Only necessary when the system operates in on-chain mode.
   * @param {string} printfulApi: Optional. Printful API key.
   * @param {string} shopType: Optional. The type of shop.
   *  The following types are supported:
   *    'empty': Default shop type. Used the empty template.
   *    'blank': No template used. Only creates populates the DB and not the data dir.
   *    'local-dir': Creates a new shop that uses the data dir from an already existing shop. For super-admin use only.
   *  The following types are not currently enabled (the BE supports them but the FE does not use them):
   *    'clone-ipfs': Creates a new shop and clones products data from a shop IPFS hash.
   *    'affiliate': Creates the shop using the affiliate template.
   *    'single-product': Creates the shop using the single-product template.
   *    'multi-product': Creates the shop using the multi-product template.
   *    'printful': Create a new shop and populate the products by syncing from printful.
   * @returns {Promise<{success: false, reason: string, field:string, message: string}|{success: true, slug: string}>}
   */
  router.post('/shop', authUser, async (req, res) => {
    const args = { ...req.body, seller: req.seller }
    const result = await createShop(args)
    if (!result.success) {
      return res.status(400).json({
        success: false,
        ...pick(result, ['reason', 'field', 'message'])
      })
    }
    return res.json({ success: true, slug: result.slug })
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

  /**
   * Updates a shop configuration.
   */
  router.put(
    '/shop/config',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const args = { seller: req.seller, shop: req.shop, data: req.body }
      const result = await updateShopConfig(args)
      if (!result.success) {
        return res.status(400).json({
          success: false,
          ...pick(result, ['reason', 'field', 'message'])
        })
      }
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

  /**
   * Deletes a shop. Super-admin only.
   */
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
   *
   * TODO:
   *  - move this under logic/shop/deploy.js
   *  - record activity in AdminLogs
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
      log.error(`Shop ${shop.id} deploy failed`)
      log.error(e)
      return res.json({ success: false, reason: e.message })
    }
  })

  /**
   * Called by admin for deploying a shop.
   *
   * TODO:
   *  - move this under logic/shop/deploy.js
   *  - record activity in AdminLogs
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
      } else if (networkConfig.awsAccessKeyId) {
        dnsProvider = 'aws'
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
        log.error(`Shop ${req.shop.id} initial deploy failed`)
        log.error(e)
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

  /**
   * Registers a wallet address associated with a shop.
   * TODO: Validate ownership of the wallet by the shop's admin calling this API.
   */
  router.post(
    '/shop/wallet',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const shop = req.shop
      const { walletAddressRaw } = req.body
      if (!walletAddressRaw) {
        return res.json({ success: false, message: 'walletAddress missing' })
      }

      // Check it is a valid eth address and checksum it.
      let walletAddress
      try {
        walletAddress = ethers.utils.getAddress(walletAddressRaw)
      } catch (e) {
        return res.json({ success: false, message: 'Invalid Ethereum address' })
      }

      // Associate the address to the shop in the DB.
      await shop.update({ walletAddress })

      return res.json({ success: true })
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
        archived: false,
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
      .reduce((items, order) => [...items, ...(order.data.items || [])], [])
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
