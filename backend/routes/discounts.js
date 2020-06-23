const { Discount } = require('../models')
const { authShop, authSellerAndShop } = require('./_auth')

const { validateDiscount, getSafeDiscountProps } = require('../utils/discounts')

module.exports = function (app) {
  app.post('/check-discount', authShop, async (req, res) => {
    const r = await validateDiscount(req.body.code, req.shop)
    if (r.discount) {
      r.discount = getSafeDiscountProps(r.discount)
    }
    res.json(r)
  })

  app.get('/discounts', authSellerAndShop, async (req, res) => {
    const discounts = await Discount.findAll({
      where: { shopId: req.shop.id },
      order: [['createdAt', 'desc']]
    })
    res.json(discounts)
  })

  app.get('/discounts/:id', authSellerAndShop, async (req, res) => {
    const discount = await Discount.findOne({
      where: {
        id: req.params.id,
        shopId: req.shop.id
      }
    })
    res.json(discount)
  })

  app.post('/discounts', authSellerAndShop, async (req, res) => {
    const discount = await Discount.create({
      shopId: req.shop.id,
      ...req.body
    })
    res.json({ success: true, discount })
  })

  app.put('/discounts/:id', authSellerAndShop, async (req, res) => {
    const result = await Discount.update(req.body, {
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

  app.delete('/discounts/:id', authSellerAndShop, async (req, res) => {
    const discount = await Discount.destroy({
      where: {
        id: req.params.id,
        shopId: req.shop.id
      }
    })
    res.json({ success: true, discount })
  })
}
