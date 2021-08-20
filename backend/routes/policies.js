const { Policies } = require('../models')
const { authShop } = require('./_auth')

/*
Use the [2] lines below to enable logging to the Terminal
const { getLogger } = require('../utils/logger')
const log = getLogger('routes.policies')
*/

/*
References:
https://sequelize.org/master/manual/model-querying-basics.html
https://expressjs.com/en/guide/routing.html
*/

module.exports = function (router) {
  // Step one: Call the middleware function 'authShop' on any POST request to the endpoint '/shop/policies'
  router.post('/shop/policies', authShop, async (req, res) => {
    // Step two: Using the result of the previous function call, find or create an instance of the model 'Policies' in the DB
    // Sequelize's 'findOrCreate' method creates a new entry in the DB if one didn't exist.
    const policyEntry = await Policies.findOrCreate({
      where: {
        shopId: req.shop.id
      },
      defaults: {
        allPolicies: [['', '', false]]
      }
    }).then((resultArray) => resultArray[0])

    // To see the output of 'findOrCreate' in the Terminal:
    // log.info(`policyEntry: `, policyEntry)

    // Step three: Regardless of whether or not a new entry was created, confirm that the data supplied by the frontend matches the policy data stored in the DB by calling Sequelize's 'update' method.
    if (policyEntry.allPolicies !== req.body) {
      const updatedPolicyEntry = await policyEntry.update({
        allPolicies: req.body
      })
      res.send(updatedPolicyEntry.get({ plain: true }))
    } else {
      res.sendStatus(200)
    }
  })

  router.get('/shop/policies', authShop, async (req, res) => {
    const data = await Policies.findOne({
      where: {
        shopId: req.shop.id
      }
    })
    res.send(data.allPolicies)
  })

  router.delete('/shop/policies', authShop, async (req, res) => {
    await Policies.destroy({
      where: {
        shopId: req.shop.id
      }
    })
    res.sendStatus(200)
  })
}
