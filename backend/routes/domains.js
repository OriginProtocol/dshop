const fetch = require('node-fetch')

const get = require('lodash/get')

const { authSellerAndShop, authRole } = require('./_auth')

const { getLogger } = require('../utils/logger')
const { getConfig } = require('../utils/encryptedConfig')

const { Network } = require('../models')

const log = getLogger('routes.domains')

module.exports = function (app) {
  app.post(
    '/domains/verify-dns',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { domain, hostname, networkId } = req.body

      log.debug('Trying to verify DNS records of domain', domain, hostname)

      try {
        const network = await Network.findOne({
          where: { networkId }
        })

        if (!network) {
          return {
            success: true,
            error: 'Invalid network ID'
          }
        }

        const networkConfig = getConfig(network.config)

        const ipfsURL = `${network.ipfsApi}/api/v0/dns?arg=${encodeURIComponent(
          domain
        )}`

        const r = await fetch(ipfsURL, {
          method: 'POST'
        })

        if (r.ok) {
          const respJson = await r.json()

          const path = get(respJson, 'Path', '').toLowerCase()
          const expectedValue = `/ipns/${hostname}.${networkConfig.domain}`.toLowerCase()

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
          error: `Your DNS changes hasn't propagated yet.`
        })
      } catch (err) {
        console.error('Failed to check DNS of domain', err)
        res.send({
          error: 'Unknown error occured'
        })
      }
    }
  )
}
