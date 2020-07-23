const dns = require('dns')
const fetch = require('node-fetch')

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
function isUnsoppableName(v) {
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
        err.toString().includes('ENODATA') ||
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
 * @returns {boolean} - if the given name is a DNS zone
 */
async function hasNS(v) {
  if (!isValidDNSName(v)) {
    throw new Error('Invalid DNS name')
  }
  if (await isValidTLD(v)) {
    throw new Error('A TLD is not a valid DNS zone')
  }

  // If there's NS records this is the apex of a zone
  try {
    await dnsResolve(v, 'NS')
    return true
  } catch (err) {
    if (
      !(
        err.toString().includes('ENODATA') ||
        err.toString().includes('EBADRESP') ||
        err.toString().includes('ENOTFOUND')
      )
    ) {
      throw err
    }
    return false
  }
}

module.exports = {
  isPublicDNSName,
  isUnsoppableName,
  isCryptoName,
  isValidDNSName,
  isValidTLD,
  hasNS,
  hasSOA,
  dnsResolve
}
