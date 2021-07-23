const { Policies } = require('../models')
const { authShop } = require('./_auth')
const { getLogger } = require('../utils/logger')

// https://sequelize.org/master/manual/model-querying-basics.html
// https://expressjs.com/en/guide/routing.html

const log = getLogger('routes.policies')

module.exports = function (router) {
  // Apply the callback 'authShop' to any POST request to the endpoint '/shop/policies'
  router.post('/shop/policies', authShop, async (req, res) => {
    log.info(`Request body: `, req.body)

    // Use the result to find or create an instance of the model 'Policies' in the DB
    const [policyEntry, created] = await Policies.findOrCreate({
      where: {
        authToken: req.shop.authToken
      },
      defaults: {
        allPolicies: ['']
      }
    })

    log.info(`policyEntry: `, policyEntry, `created? `, created)

    // If a new entry was created for the shop, check whether the front end supplied data for 'allPolicies'. Depending on the result,
    // update the entry, or just return
    if (policyEntry.allPolicies !== req.body) {
      res.send(
        await Policies.update(
          {
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

  // router.get('/shop/policies', async (req, res) => {
  //   const authToken = decodeURIComponent(
  //     String(req.headers.authorization).split(' ')[1]
  //   )
  //   const data = await Policies.findOne()
  //   res.send(data)
  // })

  router.delete('/shop/policies', authShop, async (req) => {
    return await Policies.destroy({
      where: {
        authToken: req.shop.authToken
      }
    })
  })
}
