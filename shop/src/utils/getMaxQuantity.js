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
    return QUANTITY_HARD_LIMIT
  }

  const varQuantity = get(variant, 'quantity')
  const prodMaxQuantity = get(product, 'maxQuantity')

  if (product.externalId && product.quantity === -1) {
    // -1 is substitute for unlimited stock
    return QUANTITY_HARD_LIMIT
  }

  if (varQuantity != null) {
    if (!Number.isNaN(Number(varQuantity))) {
      return Math.min(QUANTITY_HARD_LIMIT, Number(varQuantity))
    }
  }

  if (prodMaxQuantity != null) {
    if (!Number.isNaN(Number(prodMaxQuantity))) {
      return Math.min(QUANTITY_HARD_LIMIT, Number(prodMaxQuantity))
    }
  }

  return QUANTITY_HARD_LIMIT
}

export default getMaxQuantity
