const some = require('lodash/some')
const { configureCDN } = require('../logic/deploy/cdn')
const { getLogger } = require('../utils/logger')
const { getMyIP } = require('../utils/ip')
const { hasNS, hasCNAMEOrA, verifyDNS } = require('../utils/dns')
const { decryptConfig } = require('../utils/encryptedConfig')
const { Network, ShopDeployment, ShopDomain } = require('../models')
const { ShopDomainStatuses } = require('../utils/enums')
const { DEFAULT_INFRA_RESOURCES } = require('../utils/const')

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
      // Authorize user for this DNS name
      if (await hasCNAMEOrA(req.body.domain)) {
        const existing = await ShopDomain.findAll({
          where: { domain: req.body.domain.toLowerCase() }
        })

        if (existing && existing.length > 0) {
          if (existing.length > 1) {
            // Shouldn't happen in an ideal world
            log.error(
              'Found more domains of the same name than should be possible'
            )
            throw new Error('Too many domains')
          } else if (existing[0].shopId !== req.shop.id) {
            // ShopDomain is not for this shop
            log.warn('Attempt to configure domain used by another shop')
            res
              .status(401)
              .json({ success: false, reason: 'in-use', domain: null })
            return
          }
        } else {
          // DNS Name exists, but isn't associated with a shop
          log.warn('Attempt to configure domain already in use')
          res
            .status(401)
            .json({ success: false, reason: 'in-use', domain: null })
          return
        }
      }

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
        /**
         * This is potentially incompatible with deploy(), as that takes
         * subdomain as a parameter.  I don't think that parameter should ever
         * be different than the auth token, so in practice they should not
         * diverge but it can't be guaranteed unless these implementations
         * are changed to match.
         *
         * TODO: Make deploy() match this?
         */
        const domains = [`${req.shop.authToken}.${networkConfig.domain}`]
        const dres = await ShopDomain.findAll({
          where: { shopId: req.shop.id }
        })
        dres.forEach((d) => {
          if (!domains.includes(d.domain)) {
            domains.push(d.domain)
          }
        })

        if (req.shop.enableCdn) {
          await configureCDN({
            networkConfig,
            shop: req.shop,
            deployment: deployments[0],
            domains,
            resourceSelection:
              networkConfig.defaultResourceSelection || DEFAULT_INFRA_RESOURCES
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
