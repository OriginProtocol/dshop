const get = require('lodash/get')

/**
 * Accepts cart data and does all the subtotal, taxes,
 * disocunt and total calculations
 *
 * @param {Object} cart Cart data object
 *
 * @returns {{
 *  total {Number},
 *  subTotal {Number},
 *  shipping {Number},
 *  discount {Number},
 *  donation {Number},
 *  totalTaxes {Number},
 *  taxRate {Number}
 * }}
 */
const calculateCartTotal = (cart) => {
  const cartItems = get(cart, 'items', [])

  const subTotal = cartItems.reduce((total, item) => {
    return total + item.quantity * item.price
  }, 0)

  const shipping = get(cart, 'shipping.amount', 0)
  const taxRate = parseFloat(get(cart, 'taxRate', 0))
  //The attribute 'taxRate' of the 'cart' object contains the tax rate as a fixed point number with a scaling factor of 1/100
  //In other words, this number will need to be multiplied by 1/100 to get the tax rate in percentage.
  //[Sources: 'dshop/shop/src/pages/admin/settings/checkout/_CountryTaxEntry.js', 'dshop/shop/src/utils/formHelpers.js']
  const totalTaxes = Math.ceil(((taxRate / 100) * subTotal) / 100)

  const discountObj = get(cart, 'discountObj', {})
  const {
    minCartValue,
    maxDiscountValue,
    discountType,
    excludeShipping
  } = discountObj

  let discount = 0

  const preDiscountTotal =
    get(cart, 'subTotal', 0) + (excludeShipping ? 0 : shipping)
  if (!minCartValue || preDiscountTotal > minCartValue * 100) {
    // Calculate discounts only if minCartValue constraint is met

    if (discountType) {
      if (discountType === 'percentage') {
        discount = Math.round((preDiscountTotal * discountObj.value) / 100)
      } else if (discountType === 'fixed') {
        discount = discountObj.value * 100
      } else if (discountType === 'payment') {
        const activePaymentMethod = get(cart, 'paymentMethod.id')
        let isValidPayment = get(discountObj.data, activePaymentMethod, false)

        if (activePaymentMethod === 'crypto') {
          const token = get(cart, 'paymentMethod.token')
          isValidPayment = get(discountObj, `data.crypto`, {})[token]
        }

        if (isValidPayment) {
          discount = Math.round((preDiscountTotal * discountObj.value) / 100)
        }
      }
    }

    if (maxDiscountValue && ['percentage', 'payment'].includes(discountType)) {
      discount = Math.min(maxDiscountValue * 100, discount)
    }
  }

  const donation = get(cart, 'donation', 0)

  const total = Math.max(
    0,
    subTotal + shipping - discount + donation + totalTaxes
  )

  return {
    total,
    subTotal,
    shipping,
    discount,
    donation,
    totalTaxes,
    taxRate
  }
}

module.exports = calculateCartTotal
