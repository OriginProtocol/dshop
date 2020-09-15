const { getLogger } = require('../utils/logger')
const { dnsResolve, hasNS, verifyDNS } = require('../utils/dns')
const { Network, ShopDomain } = require('../models')
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
      const { domain, hostname, networkId } = req.body
      const resp = await verifyDNS(domain, hostname, networkId, req.shop)

      res.send(resp)
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

    const ipfsURL = network ? new URL(network.ipfs) : null

    // A gateway with an unusual port won't work for this
    if (network && !['', '443', '80'].includes(ipfsURL.port)) {
      log.warn(
        `Invalid IPFS gateway(${network.ipfs}). Cannot use as AutoSSL gateway`
      )
      success = false
      error = 'Cannot use this IPFS gateway for DNS configuration'
    }

    // If success so far...
    if (success) {
      try {
        isApex = await hasNS(domain)

        if (isApex) {
          const ips = await dnsResolve(ipfsURL.hostname, 'A')
          rrtype = 'A'
          rvalue = ips[0]
        } else {
          rrtype = 'CNAME'
          rvalue = `${ipfsURL.hostname}.` // Trailing dot is DNS root terminator
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
