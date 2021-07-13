const { Policies } = require('../models')
const { authShop } = require('./_auth')

// https://sequelize.org/master/manual/model-querying-basics.html
// https://expressjs.com/en/guide/routing.html

module.exports = function (router) {
  // Apply the callback 'authShop' to any POST request from the URL 'settings/legal'
  // Use the result to create an instance of the model 'Policies' in the DB
  router.post('/shop/policies', authShop, async (req) => {
    return await Policies.create({
      shopId: req.shop.authToken,
      allPolicies: req.body
    })
  })

  router.get('/shop/policies', authShop, async (req, res) => {
    const data = await Policies.findOne({
      where: {
        shopId: req.shop.authToken
      }
    })
    res.send(data.allPolicies)
  })

  // Similar logic to a POST request, difference being, an already-existing
  // instance of the model 'Policies' is updated
  router.put('/shop/policies', authShop, async (req) => {
    return await Policies.update(
      {
        allPolicies: req.body
      },
      {
        where: {
          shopId: req.shop.authToken
        }
      }
    )
  })

  router.delete('/shop/policies', authShop, async (req) => {
    return await Policies.destroy({
      where: {
        shopId: req.shop.authToken
      }
    })
  })
}
