const get = require('lodash/get')
const pick = require('lodash/pick')
const { Sequelize, Discount, Order } = require('../models')
/**
 * Finds and returns an active and valid discount with the given code
 * @param {String} code
 * @param {Models.Shop} shop
 *
 * @returns {{
 *  error,
 *  discount
 * }}
 */
const validateDiscount = async (code, shop) => {
  const discounts = await Discount.findAll({
    where: {
      [Sequelize.Op.and]: [
        { status: 'active' },
        Sequelize.where(
          Sequelize.fn('lower', Sequelize.col('code')),
          Sequelize.fn('lower', code)
        )
      ],
      shopId: shop.id,
      startTime: {
        [Sequelize.Op.lte]: Date.now()
      },
      endTime: {
        [Sequelize.Op.or]: [
          { [Sequelize.Op.gt]: Date.now() },
          { [Sequelize.Op.eq]: null }
        ]
      }
    }
  })

  if (discounts.length > 0) {
    const discount = discounts.find((d) => {
      return Number(d.maxUses) > 0 ? Number(d.uses) < Number(d.maxUses) : true
    })

    if (!discount) {
      return {
        error: 'Discount code has expired'
      }
    }

    return { discount }
  }

  return {
    error: 'Invalid discount code'
  }
}

/**
 * Picks and returns the props of discount model for public-viewing
 * @param {Model.Discount} discount
 */
const getSafeDiscountProps = (discount) => {
  return pick(discount, ['code', 'value', 'discountType'])
}

/**
 * Check if user has already used an one-use discount
 * @param {Model.Discount} discountObj
 * @param {String} userEmail
 * @param {Number} shopId
 *
 * @returns true if already used; false otherwise
 */
const checkIfUserHasAvailedDiscount = async (
  discountObj,
  userEmail,
  shopId
) => {
  if (discountObj.onePerCustomer) {
    const order = await Order.findOne({
      where: {
        shopId: shopId,
        data: {
          discountObj: {
            code: discountObj.code
          },
          userInfo: {
            email: userEmail.toLowerCase()
          }
        }
      }
    })

    return order ? true : false
  }
  return false
}

const markDiscountAsUsed = async (discountCode, shop) => {
  const { discount, error } = await validateDiscount(discountCode, shop)

  if (error) {
    throw new Error('Invalid discount')
  }

  await discount.update({
    uses: Number(discount.uses) + 1
  })
}

/**
 * Validate discount applied on an order.
 * @param {Models.Order} orderObj
 * @returns {{ valid, error }}
 */
const validateDiscountOnOrder = async (
  orderObj,
  args = { markIfValid: false }
) => {
  const { markIfValid } = args
  // IMPORTANT: Keep this function's total calculation
  // in sync with the calculation in shop/src/data/state.js
  const cart = get(orderObj, 'data')
  const appliedDiscount = get(cart, 'discount')
  const appliedDiscountObj = get(cart, 'discountObj')

  if (!cart) {
    return {
      error: 'Invalid order: No cart'
    }
  }

  if (
    !Number(appliedDiscount) === 0 ||
    get(cart, 'discountObj.value', 0) === 0
  ) {
    // Doesn't have any discounts applied,
    // skip any validation
    return {
      valid: true
    }
  }

  // Fetch discount from DB
  const {
    error,
    discount: discountObj
  } = await validateDiscount(appliedDiscountObj.code, { id: orderObj.shopId })

  if (error) {
    // TODO: What if the discount was valid when user placed an order
    // but the seller updated the discount value before the transaction
    // got mined??
    return {
      error: `Discount error: ${error}`
    }
  }

  if (discountObj.value !== appliedDiscountObj.value) {
    return {
      error: 'Discount error: Discount value mismatch'
    }
  }

  if (discountObj.discountType !== appliedDiscountObj.discountType) {
    return {
      error: 'Discount error: Discount type mismatch'
    }
  }

  const userEmail = get(cart, 'userInfo.email', '')
  if (
    await checkIfUserHasAvailedDiscount(discountObj, userEmail, orderObj.shopId)
  ) {
    return {
      error: 'Discount error: Already availed the discount'
    }
  }

  // Calculate cart total and subtotal with the discount from DB
  // and verify it against the order
  const subTotal = cart.items.reduce((total, item) => {
    return total + item.quantity * item.price
  }, 0)

  const shipping = get(cart, 'shipping.amount', 0)

  let discount = 0
  if (discountObj.discountType === 'percentage') {
    const totalWithShipping = subTotal + shipping
    discount = Math.round((totalWithShipping * discountObj.value) / 100)
  } else if (discountObj.discountType === 'fixed') {
    discount = discountObj.value * 100
  }

  const donation = get(cart, 'donation', 0)

  const calculatedTotal = subTotal + shipping - discount + donation

  if (cart.total !== calculatedTotal) {
    // Something has gone wrong
    return {
      error: `Discount error: Cart value mismatch`
    }
  }

  if (markIfValid) {
    await markDiscountAsUsed(appliedDiscountObj.code, { id: orderObj.shopId })
  }

  return { valid: true }
}

module.exports = {
  validateDiscount,
  validateDiscountOnOrder,
  getSafeDiscountProps,
  markDiscountAsUsed
}
