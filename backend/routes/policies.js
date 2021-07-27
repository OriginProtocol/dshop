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
  // Apply the callback 'authShop' to any POST request to the endpoint '/shop/policies'
  router.post('/shop/policies', authShop, async (req, res) => {
    // Use the result from the callback to find or create an instance of the model 'Policies' in the DB
    const policyEntry = await Policies.findOrCreate({
      where: {
        authToken: req.shop.authToken
      },
      defaults: {
        shopId: req.shop.id,
        allPolicies: [['', '', false]]
      }
    }).then((resultArray) => resultArray[0])

    // To see the output of 'findOrCreate' in the Terminal:
    // log.info(`policyEntry: `, policyEntry, `created? `, created)

    // Sequelize's 'findOrCreate' method creates a new entry in the DB if one didn't exist. Verify that the data supplied by the frontend
    // matches the policy data stored in the DB; update the DB if there is no match.
    if (policyEntry.allPolicies !== req.body) {
      res.send(
        await Policies.update(
          {
            shopId: req.shop.id,
            allPolicies: req.body
          },
          {
            where: {
              authToken: req.shop.authToken
            }
          }
        )
      )
    } else {
      res.send(JSON.stringify('Nothing to post.'))
    }
  })

  router.get('/shop/policies', authShop, async (req, res) => {
    const data = await Policies.findOne({
      where: {
        authToken: req.shop.authToken
      }
    })
    res.send(data.allPolicies)
  })

  router.delete('/shop/policies', authShop, async (req, res) => {
    res.send(
      await Policies.destroy({
        where: {
          authToken: req.shop.authToken
        }
      })
    )
  })
}
