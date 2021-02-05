import _get from 'lodash/get'
import getMaxQuantity from './getMaxQuantity'

/**
 * Populates products data with inventory fields
 *
 * @param {Object} product The product's data
 * @param {Object} stockData Stock data from `fetchProductStock` method
 *
 * @returns {Object} Product's data populated with inventory fields
 */
export function populateStockData(product, stockData) {
  const stockLeft = _get(stockData, 'stockLeft', product.quantity)
  const variantsStock = _get(stockData, 'variantsStock', {})

  return {
    ...product,
    quantity: stockLeft,
    variants: _get(product, 'variants', []).map((variant) => ({
      ...variant,
      quantity: _get(variantsStock, variant.id, _get(variant, 'quantity', 0))
    }))
  }
}

/**
 * Returns the stock availability of an product
 *
 * @param {Object} config Shop's config
 * @param {Object} product Product data
 * @param {Object} variant Variant data
 *
 * @returns {Boolean}
 */
export function isVariantOutOfStock(config, product, variant) {
  return getMaxQuantity(product, variant, config) == 0
}
