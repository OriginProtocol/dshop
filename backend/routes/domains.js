const fetch = require('node-fetch')
const get = require('lodash/get')

const { getLogger } = require('../utils/logger')
const { dnsResolve, isValidDNSName, hasNS } = require('../utils/dns')
const { Op, Network, ShopDeployment } = require('../models')

const { authSellerAndShop, authRole } = require('./_auth')

const log = getLogger('routes.domains')

module.exports = function (router) {
  router.post(
    '/domains/verify-dns',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { domain, hostname, networkId } = req.body

      log.debug('Trying to verify DNS records of domain', domain, hostname)

      // Verify the domain is RFC-valid
      if (!isValidDNSName(domain)) {
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
          order: [['created_at', 'DESC']]
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

  router.post('/domains/records', authSellerAndShop, async (req, res) => {
    const { domain, networkId } = req.body

    let success = true
    let error = ''
    let rrtype = null
    let rvalue = null
    let isApex = false

    const network = await Network.findOne({
      where: { networkId }
    })

    if (!network) {
      log.warning('Invalid network provided to /domains/records')
      success = false
      error = 'Invalid network'
    }

    // A gateway with an unusual port won't work for this
    if (network && network.ipfs.includes(':')) {
      log.warn('Invalid IFPS gateway. Cannot use as AutoSSL gateway')
      success = false
      error = 'Cannot use this IFPS gateway for DNS configuration'
    }

    // If success so far...
    if (success) {
      try {
        isApex = await hasNS(domain)

        if (isApex) {
          const ipfsURL = new URL(network.ipfs)
          const ips = await dnsResolve(ipfsURL.hostname, 'A')
          rrtype = 'A'
          rvalue = ips[0]
        } else {
          rrtype = 'CNAME'
          rvalue = network.ipfs
        }
      } catch (err) {
        log.error('Error checking DNS: ', err)
        success = false
        error = 'Lookup failed'
      }
    }

    return res.send({
      success,
      error,
      isApex,
      rrtype,
      rvalue
    })
  })
}
