/**
 * DNS utilities for GCP CLoud DNS
 */
const get = require('lodash/get')
const memoize = require('lodash/memoize')
const stringify = require('json-stable-stringify')
const { DNS } = require('@google-cloud/dns')

const { append } = require('../string')
const { getLogger } = require('../logger')

const log = getLogger('utils.dns.clouddns')

const DEFAULT_TTL = 60 // 1 minute

/**
 * Return a Google Cloud DNS API client
 *
 * @returns {DNS}
 */
function _getClient(credentials) {
  if (!credentials) throw new Error('Must supply GCP credentails')
  if (typeof credentials === 'string') credentials = JSON.parse(credentials)

  return new DNS({ projectId: credentials.project_id, credentials })
}
const getClient = memoize(_getClient, (a) => {
  if (!a) throw new Error('Must supply GCP credentails')
  return stringify(a[0])
})

/**
 * Get a specific Zone
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param client {object} Cloud DNS client
 * @param DNSName {string} name of DNS record
 * @returns {Zone}
 */
async function getZone(client, DNSName) {
  const [zones] = await client.getZones({ maxResults: 50 })

  for (let i = 0; i < zones.length; i++) {
    const dnsName = zones[i].metadata.dnsName
    if (dnsName === DNSName) {
      return zones[i]
    }
  }
  return null
}

/**
 * add an A record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param target {string} target IP address
 * @returns {Change}
 */
async function addA(zone, name, target) {
  const rec = zone.record('A', {
    name,
    data: target,
    ttl: DEFAULT_TTL
  })
  return await zone.addRecords(rec)
}

/**
 * add a CNAME record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param target {string} target DNS name (e.g. whatever.com)
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

/**
 * update a CNAME record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param existing {Record} Record that we're replacing
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param target {string} target IP address
 * @returns {Change}
 */
async function updateCNAME(existing, zone, name, target) {
  const addRec = zone.record('CNAME', {
    name,
    data: target,
    ttl: DEFAULT_TTL
  })
  return await zone.createChange({ add: addRec, delete: existing })
}

/**
 * Delete a record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 *
 * @param existing {Record} Record that we're replacing
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param target {string} target IP address
 * @returns {Change}
 */
async function deleteRecord(existing, zone) {
  return await zone.createChange({ delete: existing })
}

/**
 * add a TXT record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 *
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param txt {string} value of TXT record
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

/**
 * update a TXT record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 *
 * @param existing {Record} Record that we're replacing
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param txt {string} value of TXT record
 * @returns {Change}
 */
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
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param ipfsHash {string} IPFS hash to point DNSLink towards
 * @returns {Change}
 */
async function addDNSLink(zone, name, ipfsHash) {
  return await addTXT(zone, `_dnslink.${name}`, `dnslink=/ipfs/${ipfsHash}`)
}

/**
 * update a DNSLink TXT record
 *
 * Ref: https://googleapis.dev/nodejs/dns/latest/Zone.html
 * Ref: https://googleapis.dev/nodejs/dns/latest/Change.html
 *
 * @param existing {Record} Record that we're replacing
 * @param zone {Zone} zone that we're operating on
 * @param name {string} name of DNS record
 * @param ipfsHash {string} IPFS hash to point DNSLink towards
 * @returns {Change}
 */
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
 * @param {string} args.ipfsGateway - The IPFS gateway to use for DNSLink
 * @param {string} args.hash - The IPFS hash to use for DNSLink
 * @returns {array} of Change
 */
async function setRecords({
  credentials,
  zone,
  subdomain,
  ipfsGateway,
  hash,
  cname,
  ipAddresses
}) {
  const fqSubdomain = append(`${subdomain}.${zone}`, '.')
  zone = append(zone, '.')
  ipfsGateway = append(ipfsGateway, '.')

  // Configure the client with given credentials
  const client = getClient(credentials)

  const zoneObj = await getZone(client, zone)

  if (!zoneObj || !(await zoneObj.exists())) {
    log.error(`Zone ${zone} not found.`)
    return
  }

  const changes = []
  const existingARecords = await zoneObj.getRecords({
    name: fqSubdomain,
    type: 'A'
  })
  const existingAs = get(existingARecords, '[0]')
  const existingCNAMERecords = await zoneObj.getRecords({
    name: fqSubdomain,
    type: 'CNAME'
  })
  const existingCNAME = get(existingCNAMERecords, '[0][0]')
  const existingTXTRecords = await zoneObj.getRecords({
    name: `_dnslink.${fqSubdomain}`,
    type: 'TXT'
  })
  const existingTXT = get(existingTXTRecords, '[0][0]')

  // Delete all A records with this name
  if (existingAs && existingAs.length > 0) {
    for (const arec of existingARecords) {
      changes.push(await deleteRecord(arec, zoneObj))
    }
  }

  // If we got an IP address, we're creating an A record
  if (ipAddresses) {
    // Delete the CNAME records with this name
    if (existingCNAME) {
      log.debug(`Will delete CNAME for ${fqSubdomain}`)
      changes.push(await deleteRecord(existingCNAME, zoneObj))
    }

    // Create an A record for each IP we get
    for (const ip of ipAddresses) {
      log.debug(`Creating A record for ${fqSubdomain} ${ip}`)
      changes.push(await addA(zoneObj, fqSubdomain, ip))
    }
  } else {
    if (existingCNAME) {
      // Update CNAME record pointing to the IPFS gateway
      log.debug(`Updating CNAME record for ${fqSubdomain}`)
      changes.push(
        await updateCNAME(
          existingCNAME,
          zoneObj,
          fqSubdomain,
          cname ? cname : ipfsGateway
        )
      )
    } else {
      // Add CNAME record pointing to the IPFS gateway
      log.debug(`Adding CNAME record for ${fqSubdomain} ${ipfsGateway}`)
      changes.push(
        await addCNAME(zoneObj, fqSubdomain, cname ? cname : ipfsGateway)
      )
    }
  }

  if (hash) {
    if (existingTXT) {
      // Update the DNSLink record pointing at the IPFS hash
      log.debug(`Updating TXT record for ${fqSubdomain}`)
      changes.push(await updateDNSLink(existingTXT, zoneObj, fqSubdomain, hash))
    } else {
      // Add the DNSLink record pointing at the IPFS hash
      log.debug(`Adding TXT record for ${fqSubdomain}`)
      changes.push(await addDNSLink(zoneObj, fqSubdomain, hash))
    }
  }

  return changes
}

module.exports = { setRecords }
