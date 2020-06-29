// const { Resolver } = require('dns')
const fetch = require('node-fetch')

const get = require('lodash/get')

const { authSellerAndShop, authRole } = require('./_auth')

const { getLogger } = require('../utils/logger')
const { getConfig } = require('../utils/encryptedConfig')

const { Network } = require('../models')

const log = getLogger('routes.domains')

// const resolver = new Resolver()
// resolver.setServers(['8.8.8.8', '8.8.4.4'])

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

        // const cnameData = await new Promise((resolve, reject) => {
        //   resolver.resolveCname(domain, (err, data) =>
        //     err ? reject(err) : resolve(data)
        //   )
        // })

        // const cnameValid = cnameData.includes('ipfs-prod.ogn.app')
        // if (!cnameValid) {
        //   return res.send({
        //     success: true,
        //     error: `CNAME record isn't updated yet.`
        //   })
        // }

        // const txtData = await new Promise((resolve, reject) => {
        //   resolver.resolveTxt(`_dnslink.${domain}`, (err, data) =>
        //     err ? reject(err) : resolve(data)
        //   )
        // })

        // const txtValid = txtData.some((data) =>
        //   data.includes(`${hostname}.ogn.app`)
        // )

        // if (!txtValid) {
        //   return res.send({
        //     success: true,
        //     error: `TXT record isn't updated yet.`
        //   })
        // }

        // res.send({
        //   success: true,
        //   valid: true
        // })
      } catch (err) {
        console.error('Failed to check DNS of domain', err)
        res.send({
          error: 'Unknown error occured'
        })
      }
    }
  )
}
