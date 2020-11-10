const get = require('lodash/get')

/**
 * Accepts cart data and does all the subtotal, taxes,
 * disocunt and total calculations
 *
 * @param {Object} cart Cart data object
 *
 * @returns {{
 *  total {Number}
 *  subTotal {Number}
 *  shipping {Number}
 *  discount {Number}
 *  donation {Number}
 *  totalTaxes {Number}
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

  const discountObj = get(cart, 'discountObj', {})
  const { minCartValue, maxDiscountValue, discountType } = discountObj

  let discount = 0

  const totalWithShipping = get(cart, 'subTotal', 0) + shipping
  if (!minCartValue || totalWithShipping > minCartValue * 100) {
    // Calculate discounts only if minCartValue constraint is met

    if (discountType) {
      if (discountType === 'percentage') {
        discount = Math.round((totalWithShipping * discountObj.value) / 100)
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
          discount = Math.round((totalWithShipping * discountObj.value) / 100)
        }
      }
    }

    if (maxDiscountValue && ['percentage', 'payment'].includes(discountType)) {
      discount = Math.min(maxDiscountValue * 100, discount)
    }
  }

  const donation = get(cart, 'donation', 0)

  const totalTaxes = Math.ceil(taxRate * subTotal)
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
