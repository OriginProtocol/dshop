const _get = require('lodash/get')
const program = require('commander')
const { decryptConfig } = require('../../../utils/encryptedConfig')

const { get } = require('../api')
const { Product } = require('../../../models')

/**
 * Updates discontinued variants and variants that are out of stock to a collection.
 * And creates collection if it doesn't exist
 *
 * @param {Object} shop
 * @param {Number|String} productId
 * @param {Array<Object>} variants
 */
const stockUpdate = async (shop, productId, variants) => {
  const shopConfig = decryptConfig(shop.config)
  const shopInventory = _get(shopConfig, 'inventory')
  if (shopInventory) {
    const variantsStock = variants.reduce(
      (stockData, variant) => ({
        ...stockData,
        [variant]: 0
      }),
      {}
    )

    const apiKey = shopConfig.printful
    let existingVariants = 0

    if (apiKey) {
      const productData = await get(`/store/products/${productId}`, {
        apiKey: apiKey
      })
      existingVariants = _get(productData, 'result.sync_product.synced', 0) - variants.length
      existingVariants = existingVariants < 0 ? 0 : existingVariants
    }

    const updatedStockData = {
      productId: productId.toString(),
      shopId: shop.id,
      stockLeft: existingVariants * 10000,
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
  return
}

module.exports = stockUpdate
