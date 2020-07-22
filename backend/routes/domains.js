const fetch = require('node-fetch')

const get = require('lodash/get')

const { authSellerAndShop, authRole } = require('./_auth')

const { getLogger } = require('../utils/logger')

const { Op, Network, ShopDeployment } = require('../models')

const log = getLogger('routes.domains')

// eslint-disable-next-line no-useless-escape
const DNS_VALID = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/

module.exports = function (router) {
  router.post(
    '/domains/verify-dns',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { domain, hostname, networkId } = req.body

      log.debug('Trying to verify DNS records of domain', domain, hostname)

      // Verify the domain is RFC-valid
      if (!domain.match(DNS_VALID)) {
        log.debug(`${domain} is not a valid domain`)
        return res.send({
          success: true,
          error: 'Invalid domain'
        })
      }

      try {
        const network = await Network.findOne({
          where: { networkId }
        })

        if (!network) {
          log.debug(`${networkId} is not a valid network for this node`)
          return res.send({
            success: true,
            error: 'Invalid network ID'
          })
        }

        const deployment = await ShopDeployment.findOne({
          where: {
            domain: {
              [Op.like]: `%${domain}%`
            }
          },
          order: [['created_at', 'DESC']],
          limit: 1
        })

        if (!deployment) {
          log.debug(`${domain} has no deployments`)
          return res.send({
            success: true,
            error: 'No deployments'
          })
        }

        const ipfsURL = `${network.ipfsApi}/api/v0/dns?arg=${encodeURIComponent(
          domain
        )}`

        log.debug(`Making request to ${ipfsURL}`)

        const r = await fetch(ipfsURL, {
          method: 'POST'
        })

        if (r.ok) {
          const respJson = await r.json()

          const path = get(respJson, 'Path', '')
          const expectedValue = `/ipfs/${deployment.ipfsHash}`

          if (path === expectedValue) {
            return res.send({
              success: true,
              valid: true
            })
          }
        } else {
          log.error(await r.text())
        }

        return res.send({
          success: true,
          valid: false,
          error: `Your DNS changes haven't propagated yet.`
        })
      } catch (err) {
        log.error('Failed to check DNS of domain', err)
        res.send({
          error: 'Unknown error occured'
        })
      }
    }
  )
}
