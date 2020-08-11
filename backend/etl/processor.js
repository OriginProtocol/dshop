const {
  Discount,
  EtlJob,
  EtlShop,
  Network,
  Order,
  Shop,
  ShopDeployment
} = require('../models')
const { EtlJobStatuses, ShopDeploymentStatuses } = require('../enums')
const { getConfig } = require('../utils/encryptedConfig')
const { getShopDataUrl } = require('../utils/shop')

const { getLogger } = require('../utils/logger')
const log = getLogger('etl.job')

class EtlJobProcessor {
  constructor(data) {
    this.data = data
  }

  async _fetchJson(url) {
    const raw = fetch(url)
    return JSON.parse(raw)
  }

  async _countNumProducts(shop) {
    const productsUrl = `${shop.dataUrl}/products.json`
    const products = this._fetchJson(productsUrl)
    return products.length
  }

  async _countNumCollections(shop) {
    const collectionsUrl = `${shop.dataUrl}/collections.json`
    const collections = this._fetchJson(collectionsUrl)
    return collections.length
  }

  async _countNumDiscounts(shop) {
    return await Discount.count({
      where: { shopId: shop.id, status: 'active' }
    })
  }

  async _countNumShippings(shop) {
    const shippingUrl = `${shop.dataUrl}/shipping.json`
    const shippings = this._fetchJson(shippingUrl)
    return shippings.length
  }

  async _countNumOrders(shop) {
    return await Order.count({ where: { shopId: shop.id } })
  }

  async _crypto(shop) {
    return Boolean(shop.listingId)
  }

  async _stripe(shop) {
    const key = shop.config.stripeBackend
    return key && key.startsWith('sk_live')
  }

  async _paypal(shop) {
    return Boolean(shop.config.paypalClientSecret)
  }

  async _uphold(shop) {
    return Boolean(shop.config.upholdSecret)
  }

  async _manualPayment(shop) {
    const payments = shop.config.offlinePaymentMethods
    if (payments && Array.isArray(payments)) {
      const count = payments.filter((p) => p.disabled).length
      return count > 0
    }
    return false
  }

  async _printful(shop) {
    return Boolean(shop.config.printful)
  }

  async _sendgrid(shop) {
    return Boolean(shop.config.sendgridApiKey)
  }

  async _aws(shop) {
    return Boolean(shop.config.awsAccessSecret)
  }

  async _mailgun(shop) {
    return Boolean(shop.config.mailgunSmtpPassword)
  }

  async _published(shop) {
    const published = ShopDeployment.findOne({
      where: { shopId: shop.id, status: ShopDeploymentStatuses.Success }
    })
    return Boolean(published)
  }

  async _customDomain(shop) {
    // TODO(franck): figure out how to extract that information.
    log.debug(`${shop.id}: custom domain extraction not implemented yet.`)
    return false
  }

  /**
   * Extracts data for a shop.
   * @param {models.Shop} shop
   * @returns {Promise<void>}
   */
  async processShop(shop) {
    const data = {}
    data.shopId = shop.id
    data.numProducts = await this._countNumProducts(shop)
    data.numCollections = await this._countNumCollections(shop)
    data.numDiscounts = await this._countNumDiscounts(shop)
    data.numDiscounts = await this._countNumShippings(shop)
    data.numOrders = await this._countNumOrders(shop)
    data.crypto = await this._crypto(shop)
    data.stripe = await this._stripe(shop)
    data.paypal = await this._paypal(shop)
    data.uphold = await this._uphold(shop)
    data.manualPayment = await this._manualPayment(shop)
    data.printful = await this._printful(shop)
    data.sendgrid = await this._sendgrid(shop)
    data.aws = await this._aws(shop)
    data.mailgun = await this._mailgun(shop)
    data.published = await this._published(shop)
    data.customDomain = await this._customDomain(shop)
  }

  _decorateShop(shop, netConfig) {
    // Replace the shop's encrypted config with its decrypted version.
    shop.config = getConfig(shop.config)

    // Get the shop's data URL.
    shop.dataUrl = getShopDataUrl(shop, netConfig)
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
      log.info(`Processing shop ${shop.id}`)

      await this._decorateShop(shop, netConfig)

      // Extract data from the shop and insert it as a new EtlShop row.
      const data = this.processShop(shop)
      await EtlShop.create({ jobId: job.id, ...data })
    }

    await job.update({ status: EtlJobStatuses.Success })
  }
}

module.exports = {
  EtlJobProcessor
}
