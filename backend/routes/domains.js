const some = require('lodash/some')
const { configureCDN } = require('../logic/deploy/cdn')
const { getLogger } = require('../utils/logger')
const { getMyIP } = require('../utils/ip')
const { hasNS, verifyDNS } = require('../utils/dns')
const { decryptConfig } = require('../utils/encryptedConfig')
const { Network, ShopDeployment, ShopDomain } = require('../models')
const { ShopDomainStatuses } = require('../enums')

const { authSellerAndShop, authRole } = require('./_auth')

const log = getLogger('routes.domains')

module.exports = function (router) {
  router.get(
    '/shop/domains',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const domains = await ShopDomain.findAll({
        where: { shopId: req.shop.id }
      })
      res.json({ success: true, domains })
    }
  )

  router.post(
    '/shop/domains',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const domain = await ShopDomain.create({
        shopId: req.shop.id,
        domain: req.body.domain,
        status: ShopDomainStatuses.Pending
      })

      // Re-configure CDN to pick up domain changes
      const deployments = await ShopDeployment.findAll({
        where: {
          shopId: req.shop.id
        },
        limit: 1,
        order: [['createdAt', 'DESC']]
      })
      if (deployments) {
        const network = await Network.findOne({ where: { active: true } })
        const networkConfig = decryptConfig(network.config)

        const dres = await ShopDomain.findAll({
          where: { shopId: req.shop.id }
        })
        const domains = dres.map((d) => d.domain)

        if (req.shop.enableCdn) {
          await configureCDN({
            networkConfig,
            shop: req.shop,
            deployment: deployments[0],
            domains
          })
        }
      }

      res.json({ success: true, domain })
    }
  )

  router.delete(
    '/shop/domains/:domainId',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const domain = await ShopDomain.destroy({
        where: { id: req.params.domainId, shopId: req.shop.id }
      })
      res.json({ success: true, domain })
    }
  )

  router.post(
    '/domains/verify-dns',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const { domain, networkId } = req.body
      const resp = await verifyDNS(domain, networkId, req.shop)

      res.send(resp)
    }
  )

  router.post('/domains/records', authSellerAndShop, async (req, res) => {
    const { domain, networkId } = req.body
    const shopId = req.shop.id

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

    const networkConfig = decryptConfig(network.config)

    /**
     * A bit of guesswork being done here, but if previous domains have IPs
     * associated, this new one probably should as well.
     */
    const domains = await ShopDomain.findAll({ where: { shopId } })
    if (some(domains, 'ipAddress')) {
      const ips = domains.filter((d) => !!d.ipAddress).map((d) => d.ipAddress)
      rrtype = 'A'
      rvalue = ips[0]
    } else if (network) {
      const url = new URL(networkConfig.backendUrl)

      // A gateway with an unusual port won't work for this
      if (network && !['', '443', '80'].includes(url.port)) {
        log.warn(
          `Invalid domain target(${url.host}). Probably not an AutoSSL gateway`
        )
        success = false
        error = 'Cannot use this target for DNS configuration'
      }

      // If success so far...
      if (success) {
        try {
          isApex = await hasNS(domain)

          if (isApex) {
            rrtype = 'A'
            rvalue = await getMyIP()
          } else {
            rrtype = 'CNAME'
            rvalue = `${url.hostname}.` // Trailing dot is DNS root terminator
          }
        } catch (err) {
          log.error('Error checking DNS: ', err)
          success = false
          error = 'Lookup failed'
        }
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
