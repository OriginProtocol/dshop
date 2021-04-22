import get from 'lodash/get'

const QUANTITY_HARD_LIMIT = 10

/**
 * Computes the max quantity of products that can be
 * purchased. Enforces an hard cap of 10.
 *
 * @param {Object} product
 * @param {Object} variant selected variant
 * @param {Object} config shop's config
 *
 * @returns {Number} Max quantity capped to 10
 */
const getMaxQuantity = (product, variant, config) => {
  if (!get(config, 'inventory')) {
    const variantAvailable = get(variant, 'available', true)
    const productAvailable = get(product, 'available', true)
    return variantAvailable && productAvailable ? QUANTITY_HARD_LIMIT : 0
  }

  const varQuantity = parseInt(get(variant, 'quantity'))
  const prodQuantity = parseInt(get(product, 'quantity'))
  const prodMaxQuantity = parseInt(get(product, 'maxQuantity'))

  if (product.externalId && !Number.isNaN(prodQuantity)) {
    // -1 is substitute for unlimited stock
    if (prodQuantity === -1) {
      return QUANTITY_HARD_LIMIT
    } else {
      return prodQuantity <= 0 ? 0 : Math.min(QUANTITY_HARD_LIMIT, prodQuantity)
    }
  }

  if (!Number.isNaN(varQuantity)) {
    return Math.min(QUANTITY_HARD_LIMIT, varQuantity)
  }

  if (!Number.isNaN(prodMaxQuantity)) {
    return Math.min(QUANTITY_HARD_LIMIT, prodMaxQuantity)
  }

  return QUANTITY_HARD_LIMIT
}

export default getMaxQuantity
