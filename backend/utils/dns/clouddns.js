/**
 * DNS utilities for GCP CLoud DNS
 */

const { DNS } = require('@google-cloud/dns')

const { getLogger } = require('../../utils/logger')

const log = getLogger('utils.dns.clouddns')

let CACHED_CLIENT
const DEFAULT_TTL = 60 // 1 minute

/**
 * Return a Google Cloud DNS API client
 *
 * @returns {DNS}
 */
function getClient(credentials) {
  if (CACHED_CLIENT) return CACHED_CLIENT
  if (!credentials) throw new Error('Must supply GCP credentails')
  if (typeof credentials === 'string') credentials = JSON.parse(credentials)

  CACHED_CLIENT = new DNS({ projectId: credentials.project_id, credentials })

  return CACHED_CLIENT
}

/**
 * Append e to s
 *
 * @param {string} s string we're appending to
 * @param {string} e string we're appending
 * @returns {string} s+e
 */
function append(s, e) {
  if (s.endsWith(e)) return s
  return `${s}${e}`
}

/**
 * Get a specific Zone
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param {string} name of DNS record
 * @returns {Zone}
 */
async function getZone(DNSName) {
  const dns = getClient()
  const [zones] = await dns.getZones({ maxResults: 50 })

  for (let i = 0; i < zones.length; i++) {
    const dnsName = zones[i].metadata.dnsName
    if (dnsName === DNSName) {
      return zones[i]
    }
  }
  return null
}

/**
 * add a CNAME record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param {Zone} zone that we're operating on
 * @param {string} name of DNS record
 * @param {string} target DNS name (e.g. whatever.com)
 * @returns {Change}
 */
async function addCNAME(zone, name, target) {
  const rec = zone.record('CNAME', {
    name,
    data: target,
    ttl: DEFAULT_TTL
  })
  return await zone.addRecords(rec)
}

async function updateCNAME(existing, zone, name, target) {
  const addRec = zone.record('CNAME', {
    name,
    data: target,
    ttl: DEFAULT_TTL
  })
  return await zone.createChange({ add: addRec, delete: existing })
}

/**
 * add a TXT record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 *
 * @param {Zone} zone that we're operating on
 * @param {string} name of DNS record
 * @param {string} value of TXT record
 * @returns {Change}
 */
async function addTXT(zone, name, txt) {
  const rec = zone.record('TXT', {
    name,
    data: txt,
    ttl: DEFAULT_TTL
  })
  return await zone.addRecords(rec)
}

async function updateTXT(existing, zone, name, txt) {
  const addRec = zone.record('TXT', {
    name,
    data: txt,
    ttl: DEFAULT_TTL
  })
  return await zone.createChange({ add: addRec, delete: existing })
}

/**
 * add a DNSLink TXT record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 *
 * @param {Zone} zone that we're operating on
 * @param {string} name of DNS record
 * @param {string} IPFS hash to point DNSLink towards
 * @returns {Change}
 */
async function addDNSLink(zone, name, ipfsHash) {
  return await addTXT(zone, `_dnslink.${name}`, `dnslink=/ipfs/${ipfsHash}`)
}

async function updateDNSLink(existing, zone, name, ipfsHash) {
  return await updateTXT(
    existing,
    zone,
    `_dnslink.${name}`,
    `dnslink=/ipfs/${ipfsHash}`
  )
}

/**
 * Set the necessary DNS records for a shop to a subdomain controlled by
 * CloudDNS.
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 *
 * @param {object} args
 * @param {string} args.credentials - The JSON Google service account
 *  credentials
 * @param {string} args.zone - The DNS zone we're adding records to
 * @param {string} args.subdomain - The name of the record we're setting
 * @param {string} args.ipfsGateway - The IFPS gateway to use for DNSLink
 * @param {string} args.hash - The IPFS hash to use for DNSLink
 * @returns {array} of Change
 */
async function setRecords({ credentials, zone, subdomain, ipfsGateway, hash }) {
  const fqSubdomain = append(`${subdomain}.${zone}`, '.')
  zone = append(zone, '.')
  ipfsGateway = append(ipfsGateway, '.')

  // Configure the client with given credentials
  getClient(credentials)

  const zoneObj = await getZone(zone)

  if (!zoneObj || !(await zoneObj.exists())) {
    log.error(`Zone ${zone} not found.`)
    return
  }

  const recordsRaw = await zoneObj.getRecords({ maxResults: 250 })
  const records = recordsRaw ? recordsRaw[0] : []

  const changes = []

  const existingCNAME = records.find(
    (rec) => rec.name === fqSubdomain && rec.type === 'CNAME'
  )
  const existingTXT = records.find(
    (rec) => rec.name === `_dnslink.${fqSubdomain}` && rec.type === 'TXT'
  )

  if (existingCNAME) {
    // Update CNAME record pointing to the IPFS gateway
    changes.push(
      await updateCNAME(existingCNAME, zoneObj, fqSubdomain, ipfsGateway)
    )
  } else {
    // Add CNAME record pointing to the IPFS gateway
    changes.push(await addCNAME(zoneObj, fqSubdomain, ipfsGateway))
  }
  if (existingTXT) {
    // Update the DNSLink record pointing at the IPFS hash
    changes.push(await updateDNSLink(existingTXT, zoneObj, fqSubdomain, hash))
  } else {
    // Add the DNSLink record pointing at the IPFS hash
    changes.push(await addDNSLink(zoneObj, fqSubdomain, hash))
  }

  return changes
}

module.exports = setRecords
