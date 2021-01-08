const fetch = require('node-fetch')
const fs = require('fs')

const {
  Discount,
  EtlJob,
  EtlShop,
  Network,
  Order,
  Sequelize,
  Shop,
  ShopDeployment,
  ShopDomain
} = require('../models')
const { EtlJobStatuses, ShopDeploymentStatuses } = require('../utils/enums')
const { getConfig } = require('../utils/encryptedConfig')
const { getShopDataUrl } = require('../utils/shop')
const { DSHOP_CACHE } = require('../utils/const')

const { getLogger } = require('../utils/logger')
const log = getLogger('etl.job')

const FETCH_TIMEOUT_MS = 60000 // 60 sec

class EtlJobProcessor {
  constructor(data) {
    this.data = data
  }

  async _fetchJson(shop, filename) {
    if (shop.published) {
      // Shop is published. Fetch the data from IPFS.
      const url = `${shop.dataUrl}${filename}`
      log.debug(`Fetching ${url}`)
      const response = await fetch(url, { timeout: FETCH_TIMEOUT_MS })
      return response.json()
    } else {
      // Shop is not published yet. Fetch the data from the staging deploy area on disk.
      const path = `${shop.outputDir}/${filename}`
      log.debug(`Reading ${path}`)
      const raw = fs.readFileSync(path)
      return JSON.parse(raw)
    }
  }

  async _countNumProducts(shop) {
    try {
      const products = await this._fetchJson(shop, 'products.json')
      return products.length
    } catch (e) {
      log.error(`Shop ${shop.id}: Failed counting products: ${e}`)
      return null
    }
  }

  async _countNumCollections(shop) {
    try {
      const collections = await this._fetchJson(shop, 'collections.json')
      return collections.length
    } catch (e) {
      log.error(`Shop ${shop.id}: Failed counting collections: ${e}`)
      return null
    }
  }

  async _countNumShippings(shop) {
    try {
      const shippings = await this._fetchJson(shop, 'shipping.json')
      return shippings.length
    } catch (e) {
      log.error(`Shop ${shop.id}: Failed counting shipping methods: ${e}`)
      return null
    }
  }

  async _countNumDiscounts(shop) {
    return Discount.count({
      where: { shopId: shop.id, status: 'active' }
    })
  }

  async _countNumOrders(shop) {
    return Order.count({ where: { shopId: shop.id } })
  }

  _crypto(shop) {
    return Boolean(shop.walletAddress)
  }

  _stripe(shop) {
    const key = shop.config.stripeBackend
    return Boolean(key && key.startsWith('sk_live'))
  }

  _paypal(shop) {
    return Boolean(shop.config.paypalClientSecret)
  }

  _uphold(shop) {
    return Boolean(shop.config.upholdSecret)
  }

  _manualPayment(shop) {
    const payments = shop.config.offlinePaymentMethods
    if (payments && Array.isArray(payments)) {
      const count = payments.filter((p) => p.disabled === true).length
      return count > 0
    }
    return false
  }

  _printful(shop) {
    return Boolean(shop.config.printful)
  }

  _sendgrid(shop) {
    return Boolean(shop.config.sendgridApiKey)
  }

  _aws(shop) {
    return Boolean(shop.config.awsAccessSecret)
  }

  _mailgun(shop) {
    return Boolean(shop.config.mailgunSmtpPassword)
  }

  async _published(shop) {
    const published = await ShopDeployment.findOne({
      where: { shopId: shop.id, status: ShopDeploymentStatuses.Success }
    })
    return Boolean(published)
  }

  // Check if the most recent publish (if any) used a custom domain.
  async _customDomain(shop) {
    const custom = await ShopDomain.findOne({
      where: { shopId: shop.id },
      order: [['id', 'desc']]
    })
    return custom ? custom.domain.indexOf('ogn.app') > 0 : false
  }

  // Determine if a shop has been active since the last time the etl_shop job ran.
  // A shop is deemed active if it meets at least one of these criteria:
  //  - had a config change
  //  - had a deploy
  //  - had a sale
  //  - had a collection or product added or deleted
  // TODO: would be good to detect if a collection/product was edited and count that
  //  towards a shop activity. But it is hard given the lack of historical data because
  //  collections and products are stored on disk rather than in the DB.
  async _active(shop, data, prevData) {
    // Check if the shop had a config change either to the core configs stored in the DB
    // or to discounts and shipping settings.
    if (shop.updatedAt >= prevData.createdAt) {
      return true
    }
    if (
      data.numShippings !== prevData.numShippings ||
      data.numDiscounts !== prevData.numDiscounts
    ) {
      return true
    }

    // Check if the shop was deployed.
    const published = await ShopDeployment.findOne({
      where: {
        shopId: shop.id,
        createdAt: { [Sequelize.Op.gt]: prevData.createdAt }
      }
    })
    if (published) {
      return true
    }

    // Check if the shop had an order.
    if (data.numOrders !== prevData.numOrders) {
      return true
    }

    // Check if the shop has a different number of products or collections.
    if (
      data.numProducts !== prevData.numProducts ||
      data.numCollections !== prevData.numCollections
    ) {
      return true
    }

    return false
  }

  /**
   * Extracts data for a shop.
   * @param {models.Shop} shop
   * @returns {Promise<void>}
   */
  async processShop(shop) {
    const prevData = await EtlShop.findOne({
      where: { shopId: shop.id },
      order: [['id', 'desc']]
    })

    const data = {}
    data.shopId = shop.id
    data.numProducts = await this._countNumProducts(shop)
    data.numCollections = await this._countNumCollections(shop)
    data.numDiscounts = await this._countNumDiscounts(shop)
    data.numShippings = await this._countNumShippings(shop)
    data.numOrders = await this._countNumOrders(shop)
    data.crypto = this._crypto(shop)
    data.stripe = this._stripe(shop)
    data.paypal = this._paypal(shop)
    data.uphold = this._uphold(shop)
    data.manualPayment = this._manualPayment(shop)
    data.printful = this._printful(shop)
    data.sendgrid = this._sendgrid(shop)
    data.aws = this._aws(shop)
    data.mailgun = this._mailgun(shop)
    data.published = shop.published
    data.customDomain = await this._customDomain(shop)
    data.active = await this._active(shop, data, prevData)
    return data
  }

  async _decorateShop(shop, netConfig) {
    // Replace the shop's encrypted config with its decrypted version.
    shop.config = getConfig(shop.config)

    // Determine if the shop was published. This is used when extracting data
    // to decide on what source to use: IPFS vs deploy staging area on disk.
    shop.published = await this._published(shop)

    // Get the shop's data URL.
    shop.dataUrl = getShopDataUrl(shop, netConfig)

    // Get the shop's deploy dir.
    shop.outputDir = `${DSHOP_CACHE}/${shop.authToken}/data`
  }

  /**
   * Main
   * @returns {Promise<void>}
   */
  async run() {
    log.info('Running ETL job...')
    const job = await EtlJob.create({ status: EtlJobStatuses.Running })

    const network = await Network.findOne({ where: { active: true } })
    const netConfig = getConfig(network.config)

    const shops = await Shop.findAll({ order: [['id', 'asc']] })
    for (const shop of shops) {
      try {
        log.info(`Processing shop ${shop.id}`)

        await this._decorateShop(shop, netConfig)

        // Extract data from the shop and insert it as a new EtlShop row.
        const data = await this.processShop(shop)
        await EtlShop.create({ jobId: job.id, ...data })
      } catch (e) {
        // Log the error but continue processing other shops.
        log.error(`Shop ${shop.id}: Failed extracting ETL data: ${e}`)
      }
    }
    // Mark the job as successfully completed.
    await job.update({ status: EtlJobStatuses.Success })
    log.info('ETL job run finished.')
  }
}

module.exports = {
  EtlJobProcessor
}
