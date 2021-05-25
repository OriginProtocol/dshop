const dns = require('dns')
const fetch = require('node-fetch')
const get = require('lodash/get')
const every = require('lodash/every')
const { Resolution } = require('@unstoppabledomains/resolution')

const { Network, ShopDeployment, ShopDomain } = require('../../models')
const { ShopDomainStatuses } = require('../enums')
const { getLogger } = require('../logger')

const log = getLogger('utils.dns')

const TLD_LIST_URL = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt'
const UNSTOPPABLE_TLDS = ['crypto']
const CRYPTO_DOMAINS = [...UNSTOPPABLE_TLDS]
// eslint-disable-next-line no-useless-escape
const DNS_VALID = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/

let CACHED_TLDS = null

/**
 * Is the given hostname a crypto name?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a crypto domain
 */
function isCryptoName(v, tlds = CRYPTO_DOMAINS) {
  if (typeof v !== 'string' || v.length <= 3 || !v.includes('.')) {
    return false
  }
  const tld = v.split('.').slice(-1)[0]
  return tlds.includes(tld)
}

/**
 * Is the given hostname an unstoppable domain name?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a crypto domain
 */
function isUnstoppableName(v) {
  return isCryptoName(v, UNSTOPPABLE_TLDS)
}

/**
 * Is the given hostname a public DNS name
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a public DNS name
 */
function isPublicDNSName(v) {
  return (
    !isCryptoName(v) && typeof v === 'string' && v.length > 3 && v.includes('.')
  )
}

/**
 * Is the given hostname a valid DNS name
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a valid DNS name
 */
function isValidDNSName(v) {
  return v.match(DNS_VALID)
}

/**
 * Fetch a TLD list from IANA and return an array of valid TLDs
 *
 * @returns {Array} - of valid TLDs in caps
 */
async function getTLDArray() {
  const resp = await fetch(TLD_LIST_URL)

  if (!resp.ok) {
    throw new Error('Error getting TLD list from IANA')
  }

  const tldsText = await resp.text()
  return tldsText.split('\n').filter((ln) => !ln.startsWith('#'))
}

/**
 * Is the given string a valid TLD?
 *
 * @param v {string} - The string to check
 * @returns {boolean} - if the given name is a valid TLD
 */
async function isValidTLD(v) {
  if (!CACHED_TLDS) {
    CACHED_TLDS = await getTLDArray()
  }
  return CACHED_TLDS.includes(v.toUpperCase())
}

/**
 * Resolve a DNS record
 *
 * @param name {string} - The DNS name to lookup
 * @returns {Promise<object|Error>} - The DNS record
 */
function dnsResolve(name, rrtype) {
  return new Promise((resolve, reject) => {
    dns.resolve(name, rrtype, (err, rec) => {
      if (err) return reject(err)
      resolve(rec)
    })
  })
}

/**
 * Check if a given name has a CNAME or A record
 *
 * @param name {string} - The DNS name to lookup
 * @returns {Promise<boolean>} - If a CNAME or A record exists for name
 */
async function hasCNAMEOrA(name) {
  try {
    await dnsResolve(name, 'A')
    return true
  } catch {
    /* pass */
  }

  try {
    await dnsResolve(name, 'CNAME')
    return true
  } catch {
    /* pass */
  }

  return false
}

/**
 * Does the given name have SOA records?
 *
 * @param v {string} - The DNS name to check
 * @returns {boolean} - if the given name has SOA records
 */
async function hasSOA(v) {
  if (!isValidDNSName(v)) {
    throw new Error('Invalid DNS name')
  }
  if (await isValidTLD(v)) {
    throw new Error('A TLD is not a valid DNS name')
  }

  // If there's an SOA record this is the apex domain of a zone
  try {
    await dnsResolve(v, 'SOA')
    return true
  } catch (err) {
    if (
      !(
        err.toString().includes('EBADRESP') ||
        err.toString().includes('ENOTFOUND')
      )
    ) {
      throw err
    }
    return false
  }
}

/**
 * Does the given DNS name have NS records?  Is this a zone?
 *
 * @param v {string} - The name to check
 * @param opts {object} - Options object
 * @param opts {object.followCNAME} - If a CNAME should be followed for a result
 * @returns {boolean} - if the given name is a DNS zone
 */
async function hasNS(v, opts = {}) {
  if (!isValidDNSName(v)) {
    throw new Error('Invalid DNS name')
  }
  if (await isValidTLD(v)) {
    throw new Error('A TLD is not a valid DNS zone')
  }

  // If there's NS records this is the apex of a zone
  try {
    if (!opts.followCNAME) {
      try {
        const cnRes = await dnsResolve(v, 'CNAME')

        if (cnRes) {
          return false
        }
      } catch (err) {
        if (!err.toString().includes('ENODATA')) {
          throw err
        }
      }
    }
    await dnsResolve(v, 'NS')
    return true
  } catch (err) {
    if (
      !(
        err.toString().includes('EBADRESP') ||
        err.toString().includes('ENOTFOUND')
      )
    ) {
      throw err
    }
    return false
  }
}

async function verifyDNS(domain, networkId, shop) {
  log.debug('Trying to verify DNS records of domain', domain)

  const deployment = await ShopDeployment.findOne({
    where: {
      shopId: shop.id
    },
    order: [['created_at', 'DESC']]
  })

  const domains = await ShopDomain.findAll({
    where: { shopId: shop.id }
  })

  const ipAddresses = domains
    ? domains.filter((d) => !!d.ipAddress).map((d) => d.ipAddress)
    : []
  const hasIP = ipAddresses ? !!ipAddresses.length : false

  // Verify the domain is RFC-valid
  if (!isValidDNSName(domain)) {
    log.debug(`${domain} is not a valid domain`)
    return {
      success: true,
      error: 'Invalid domain'
    }
  }

  if (hasIP) {
    try {
      const records = await dnsResolve(domain, 'A')

      const valid = every(ipAddresses.map((ip) => records.includes(ip)))

      if (valid) {
        await ShopDomain.update(
          {
            status: ShopDomainStatuses.Success
          },
          {
            where: {
              domain: domain.toLowerCase(),
              shopId: shop.id
            }
          }
        )
      }

      return {
        success: true,
        valid
      }
    } catch (err) {
      if (err.message.includes('ENOTFOUND')) {
        return {
          success: true,
          valid: false,
          error: `Your DNS changes haven't propagated yet.`
        }
      }

      log.error(err)
      return {
        error: err.message
      }
    }
  }

  if (isUnstoppableName(domain)) {
    try {
      const resolution = new Resolution()
      const hash = await resolution.ipfsHash(domain)

      const valid = hash === deployment.ipfsHash

      const error = valid ? null : 'IPFS hash is not yet updated.'

      if (valid) {
        // Update DB if resolved
        await ShopDomain.update(
          {
            status: ShopDomainStatuses.Success
          },
          {
            where: {
              domain: domain.toLowerCase(),
              shopId: shop.id
            }
          }
        )
      }

      return {
        success: true,
        valid,
        error
      }
    } catch (err) {
      log.error('Failed to resolve unstoppable domain', err)
      return {
        error: err.message
      }
    }
  }

  try {
    const network = await Network.findOne({
      where: { networkId }
    })

    if (!network) {
      log.debug(`${networkId} is not a valid network for this node`)
      return {
        success: true,
        error: 'Invalid network ID'
      }
    }

    if (!deployment) {
      log.debug(`${domain} has no deployments`)
      return {
        success: true,
        error:
          'No deployments found.  You must publish the shop before setting a custom domain.'
      }
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
        // Update DB if resolved
        await ShopDomain.update(
          {
            status: ShopDomainStatuses.Success
          },
          {
            where: {
              domain: domain.toLowerCase(),
              shopId: shop.id
            }
          }
        )

        return {
          success: true,
          valid: true
        }
      }
    } else {
      log.error(await r.text())
    }

    return {
      success: true,
      valid: false,
      error: `Your DNS changes haven't propagated yet.`
    }
  } catch (err) {
    log.error('Failed to check DNS of domain', err)
    return {
      error: 'Unknown error occured'
    }
  }
}

module.exports = {
  isPublicDNSName,
  isUnstoppableName,
  isCryptoName,
  isValidDNSName,
  isValidTLD,
  hasNS,
  hasSOA,
  hasCNAMEOrA,
  dnsResolve,
  verifyDNS
}
