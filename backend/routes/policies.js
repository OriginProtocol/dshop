const { Policies } = require('../models')
const { authShop } = require('./_auth')
const { getLogger } = require('../utils/logger')

// https://sequelize.org/master/manual/model-querying-basics.html
// https://expressjs.com/en/guide/routing.html

const log = getLogger('routes.policies')

module.exports = function (router) {
  // Apply the callback 'authShop' to any POST request to the endpoint '/shop/policies'
  // Use the result to create an instance of the model 'Policies' in the DB
  router.post('/shop/policies', authShop, async (req, res) => {
    log.info(`Request body: `, req.body)
    res.send(
      await Policies.create({
        allPolicies: req.body,
        authToken: req.shop.authToken
      })
    )
  })

  router.get('/shop/policies', authShop, async (req, res) => {
    const data = await Policies.findOne({
      where: {
        authToken: req.shop.authToken
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
          authToken: req.shop.authToken
        }
      }
    )
  })

  router.delete('/shop/policies', authShop, async (req) => {
    return await Policies.destroy({
      where: {
        authToken: req.shop.authToken
      }
    })
  })
}
