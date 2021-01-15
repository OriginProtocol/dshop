const get = require('lodash/get')
const { decryptConfig } = require('../../../utils/encryptedConfig')

const { Product } = require('../../../models')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('utils.printful.writeProductData')

/**
 * Appends a productId to a collection.
 * And creates collection if it doesn't exist
 *
 * @param {Object} shop
 * @param {Number|String} productId
 * @param {Array<Object>} variants
 */
const stockUpdate = async (shop, productId, variants) => {
  try {
    const shopConfig = decryptConfig(shop.config)
    const shopInventory = get(shopConfig, 'inventory')
    if (shopInventory) {
      // Add to products model
      const variantsStock = variants.reduce(
        (stockData, variant) => ({
          ...stockData,
          [variant]: 0
        }),
        {}
      )

      const updatedStockData = {
        productId: productId.toString(),
        shopId: shop.id,
        stockLeft: 0,
        variantsStock
      }

      let existingDbItem

      if (productId) {
        existingDbItem = await Product.findOne({
          where: {
            productId: productId.toString(),
            shopId: shop.id
          }
        })
      }

      if (existingDbItem) {
        await existingDbItem.update(updatedStockData)
      } else {
        await Product.create(updatedStockData)
      }
    }
  } catch (e) {
    log.error('Failed to stock update while syncing printful products', e)
  }
  return
}

module.exports = stockUpdate
