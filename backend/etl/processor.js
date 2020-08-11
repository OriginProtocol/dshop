const { EtlJob, EtlShop, Shop, Discount, Order } = require('../models')
const { EtlJobStatuses } = require('../enums')
const { getConfig } = require('../utils/encryptedConfig')

const { getLogger } = require('../utils/logger')
const log = getLogger('etl.job')

class EtlJobProcessor {
  constructor(data) {
    this.data = data
  }

  async _countNumProducts(shop) {
    // TODO: fetch products.json and count how many.
    return 0
  }

  async _countNumCollections(shop) {
    // TODO: fetch collections.json and count how many.
    return 0
  }

  async _countNumDiscounts(shop) {
    return await Discount.count({
      where: { shopId: shop.id, status: 'active' }
    })
  }

  async _countNumShippings(shop) {
    // TODO: fetch shipping.json and count how many.
    return 0
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

  async _customDomain(shop) {
    // TODO
    return false
  }

  /**
   * Extract data for a shop.
   * @param {modesl.Shop} shop
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
    data.customDomain = await this._customDomain(shop)
  }

  /**
   * Main
   * @returns {Promise<void>}
   */
  async run() {
    log.info('Running ETL job...')
    const job = await EtlJob.create({ status: EtlJobStatuses.Running })

    const shops = await Shop.findAll({ order: [['id', 'asc']] })
    for (const shop of shops) {
      log.info(`Processing shop ${shop.id}`)

      // Replace the shop's encrypted config with its decrypted version.
      shop.config = getConfig(shop.config)

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
