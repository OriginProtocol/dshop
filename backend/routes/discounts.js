const pick = require('lodash/pick')

const { Discount } = require('../models')
const { authShop, authSellerAndShop } = require('./_auth')

const { validateDiscount, getSafeDiscountProps } = require('../utils/discounts')

module.exports = function (router) {
  router.post('/check-discount', authShop, async (req, res) => {
    const r = await validateDiscount(req.body.code, req.shop)
    if (r.discount) {
      r.discount = getSafeDiscountProps(r.discount)
    }
    res.json(r)
  })

  router.get('/discounts', authSellerAndShop, async (req, res) => {
    const discounts = await Discount.findAll({
      where: { shopId: req.shop.id },
      order: [['createdAt', 'desc']]
    })
    res.json(discounts)
  })

  router.get('/discounts/:id', authSellerAndShop, async (req, res) => {
    const discount = await Discount.findOne({
      where: {
        id: req.params.id,
        shopId: req.shop.id
      }
    })
    res.json(discount)
  })

  router.post('/discounts', authSellerAndShop, async (req, res) => {
    const discount = await Discount.create({
      ...req.body,
      shopId: req.shop.id
    })
    res.json({ success: true, discount })
  })

  router.put('/discounts/:id', authSellerAndShop, async (req, res) => {
    const data = pick(req.body, [
      'status',
      'code',
      'discountType',
      'value',
      'maxUses',
      'onePerCustomer',
      'startTime',
      'endTime'
    ])
    const result = await Discount.update(data, {
      where: {
        id: req.params.id,
        shopId: req.shop.id
      }
    })

    if (!result || result[0] < 1) {
      return res.json({ success: false })
    }

    const discount = await Discount.findOne({
      where: {
        id: req.params.id,
        shopId: req.shop.id
      }
    })

    res.json({ success: true, discount })
  })

  router.delete('/discounts/:id', authSellerAndShop, async (req, res) => {
    const discount = await Discount.destroy({
      where: {
        id: req.params.id,
        shopId: req.shop.id
      }
    })
    res.json({ success: true, discount })
  })
}
