const { Seller, Shop, SellerShop } = require('../models')
const { authSuperUser } = require('./_auth')
const { createSeller } = require('../utils/sellers')

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

  app.post('/superuser/users', authSuperUser, async (req, res) => {
    console.log(req.body)
    createSeller(req.body).then(result => {
      res.json(result)
    })
  })
}
