const { Resolver } = require('dns')

const { authSellerAndShop, authRole } = require('./_auth')

const { getLogger } = require('../utils/logger')

const log = getLogger('routes.domains')

const resolver = new Resolver()
resolver.setServers(['8.8.8.8', '8.8.4.4'])

module.exports = function (app) {
  app.post(
    '/domains/verify-dns',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { domain, hostname } = req.body

      log.debug('Trying to verify DNS records of domain', domain, hostname)

      try {
        const cnameData = await new Promise((resolve, reject) => {
          resolver.resolveCname(domain, (err, data) =>
            err ? reject(err) : resolve(data)
          )
        })

        const cnameValid = cnameData.includes('ipfs-prod.ogn.app')
        if (!cnameValid) {
          return res.send({
            success: true,
            error: `CNAME record isn't updated yet.`
          })
        }

        const txtData = await new Promise((resolve, reject) => {
          resolver.resolveTxt(`_dnslink.${domain}`, (err, data) =>
            err ? reject(err) : resolve(data)
          )
        })

        const txtValid = txtData.some((data) =>
          data.includes(`${hostname}.ogn.app`)
        )

        if (!txtValid) {
          return res.send({
            success: true,
            error: `TXT record isn't updated yet.`
          })
        }

        res.send({
          success: true,
          valid: true,
          cnameData,
          txtData
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
