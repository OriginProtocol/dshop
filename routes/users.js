const { Seller, Shop, SellerShop } = require('../models')
const { authSuperUser, createSalt, hashPassword } = require('./_auth')
const { createSeller } = require('../utils/sellers')
const pick = require('lodash/pick')
const { Op } = require('sequelize')

module.exports = function (app) {
  app.get('/superuser/users', authSuperUser, async (req, res) => {
    Seller.findAll().then((users) => {
      res.json({ users })
    })
  })

  app.get('/superuser/users/:userId', authSuperUser, async (req, res) => {
    Seller.findOne({
      where: { id: req.params.userId },
      include: Shop
    }).then((user) => {
      SellerShop.findAll({
        where: { sellerId: user.id },
        include: { model: Shop, as: 'shop', attributes: ['authToken', 'name'] }
      }).then((shops) => {
        res.json({
          user,
          shops: shops.map((s) => s.toJSON()).filter((s) => s.shop)
        })
      })
    })
  })

  app.put('/superuser/users/:userId', authSuperUser, async (req, res) => {
    const user = await Seller.findOne({ where: { id: req.params.userId } })
    if (!user) {
      return res.json({ success: false, reason: 'no-such-user' })
    }
    const email = req.body.email.toLowerCase()
    const userWithEmail = await Seller.findOne({
      where: { [Op.not]: [{ id: req.params.userId }], email }
    })
    if (userWithEmail) {
      return res.json({
        success: false,
        field: 'email',
        reason: 'Email exists'
      })
    }

    const fields = pick(req.body, 'name', 'email')
    const passwordPlain = req.body.password
    if (passwordPlain) {
      const salt = await createSalt()
      fields.password = await hashPassword(salt, passwordPlain)
    }

    await Seller.update(fields, { where: { id: req.params.userId } })
    res.json({ success: true })
  })

  app.post('/superuser/users', authSuperUser, async (req, res) => {
    createSeller(req.body).then((result) => {
      res.json(result)
    })
  })
}
