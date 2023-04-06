const { get } = require('lodash')
const { DiscountTypeEnums } = require('../../utils/enums')

const { Sequelize, Discount, Order } = require('../../models')

/**
 * Finds and returns an active and valid discount with the given code for a shop.
 * @param {String} code
 * @param {Models.Shop} shop
 *
 * @returns {{error: string}|{discount: models.Discount}}
 */
const validateDiscount = async (code, shop) => {
  const where = {
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

  if (!code) {
    // Discounts of type 'payment' won't have a code
    where.discountType = DiscountTypeEnums.payment
  }

  const discounts = await Discount.findAll({
    where
  })

  if (discounts.length > 0) {
    const discount = discounts.find((d) => {
      return Number(d.maxUses) > 0 ? d.uses < d.maxUses : true
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

/**
 * Validate the discount applied to an order.
 * If the discount is valid, increment the DB counter tracking its number of uses.
 *
 * @param {Models.Order} orderObj
 * @returns {{ valid: true}|{ error: string }}
 */
const validateDiscountOnOrder = async (orderObj) => {
  // Get the cart data.
  const cart = get(orderObj, 'data')
  if (!cart) {
    return { error: 'Invalid order: No cart' }
  }

  const appliedDiscountObj = get(cart, 'discountObj', {})
  const appliedDiscount = Number(get(cart, 'discount', 0))
  if (appliedDiscountObj.value === undefined) {
    // Non-existent or empty discount object. Ensure there is no discount amount applied.
    if (isNaN(appliedDiscount) || appliedDiscount === 0) {
      // No discount object and no discount amount. Order is valid.
      return { valid: true }
    } else {
      // Inconsistent data: discount amount present but not discount object.
      return { error: 'Invalid discount in the cart' }
    }
  }

  // There is a discount object in the cart so we expect a discount amount.
  if (isNaN(appliedDiscount)) {
    return { error: 'Invalid discount in the cart' }
  }

  // Fetch the discount from DB and check it is valid.
  const {
    error,
    discount: discountObj
  } = await validateDiscount(appliedDiscountObj.code, { id: orderObj.shopId })

  if (error) {
    // TODO: What if the discount was valid when user placed an order
    // but the seller updated the discount value before the transaction
    // got mined??
    return { error: `Discount error: ${error}` }
  }

  // Check the value of the discount in the DB vs cart match.
  if (discountObj.value !== appliedDiscountObj.value) {
    return { error: 'Discount error: Discount value mismatch' }
  }

  // Check the discount type in the DB vs cart match.
  if (discountObj.discountType !== appliedDiscountObj.discountType) {
    return { error: 'Discount error: Discount type mismatch' }
  }

  // If it's a one-time per user discount, make sure the user did not
  // already used up this discount.
  const userEmail = get(cart, 'userInfo.email', '')
  if (
    await checkIfUserHasAvailedDiscount(discountObj, userEmail, orderObj.shopId)
  ) {
    return { error: 'Discount error: Already availed the discount' }
  }

  // Increment the DB counter tracking the discount's number of uses.
  await discountObj.update({ uses: discountObj.uses + 1 })

  return { valid: true }
}

module.exports = {
  validateDiscount,
  validateDiscountOnOrder
}
