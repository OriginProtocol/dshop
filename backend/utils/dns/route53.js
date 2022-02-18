/**
 * DNS utilities for AWS Route 53
 */
const memoize = require('lodash/memoize')
const stringify = require('json-stable-stringify')
const Route53 = require('aws-sdk/clients/route53')

const { append } = require('../string')
const { getLogger } = require('../logger')
const { DEFAULT_AWS_REGION } = require('./const')

const log = getLogger('utils.dns.route53')

const AWS_API_VERSION = '2013-04-01'

function _getClient(credentials) {
  if (typeof credentials === 'string') credentials = JSON.parse(credentials)

  return new Route53({ apiVersion: AWS_API_VERSION, ...credentials })
}

/**
 * Return a Amazon Route53 DNS API client
 * @param credentials <object> | null - AWS credentials are expected as a parameter if DShop is not deployed on Amazon EC2. aws-sdk can handle authentication tasks for a DShop instances running on EC2
 * Ref: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html#instance-metadata-security-credentials
 * @returns {DNS}
 */
const getClient = (credentials) => {
  if (credentials) {
    memoize(_getClient, (a) => {
      if (!a) throw new Error('Must supply AWS credentials')
      return stringify(a[0])
    })
  } else {
    return new Route53({
      apiVersion: AWS_API_VERSION,
      region: DEFAULT_AWS_REGION
    })
  }
}

/**
 * Create a change request object for use with changeResourceRecordSets
 *
 * @param action {string}
 * @param name {string}
 * @param type {string}
 * @param records {Array}
 * @param ttl {Number}
 * @returns {object} change request
 */
function createChangeRequest(action, name, type, records, ttl = 60) {
  return {
    Action: action,
    ResourceRecordSet: {
      Name: append(name, '.'),
      ResourceRecords: records,
      TTL: ttl,
      Type: type
    }
  }
}

/**
 * Create an array of change request records from an array of DNS record values
 *
 * @param values {Array} of record values
 * @returns {Array} of objects to give for ResourceRecords in a change request
 */
function createChangeRequestRecords(values) {
  if (!(values instanceof Array)) values = [values]
  return values.map((v) => {
    return { Value: v }
  })
}

/**
 * Create a change request record for a A
 *
 * @param name {string} the DNS name for the record
 * @param values {Array} of record values
 * @returns {object} ResourceRecord change request
 */
function addA(name, values) {
  return createChangeRequest(
    'CREATE',
    name,
    'A',
    createChangeRequestRecords(values)
  )
}

/**
 * Create a change request record to delete a CNAME
 *
 * @param name {string} the DNS name for the record
 * @param values {Array} of record values
 * @returns {object} ResourceRecord change request
 */
function deleteA(name, values) {
  return createChangeRequest(
    'DELETE',
    name,
    'A',
    createChangeRequestRecords(values)
  )
}

/**
 * Create a change request record for a CNAME
 *
 * @param name {string} the DNS name for the record
 * @param values {Array} of record values
 * @returns {object} ResourceRecord change request
 */
function addCNAME(name, values) {
  return createChangeRequest(
    'CREATE',
    name,
    'CNAME',
    createChangeRequestRecords(values)
  )
}

/**
 * Create a change request record to delete a CNAME
 *
 * @param name {string} the DNS name for the record
 * @param values {Array} of record values
 * @returns {object} ResourceRecord change request
 */
function deleteCNAME(name, values) {
  return createChangeRequest(
    'DELETE',
    name,
    'CNAME',
    createChangeRequestRecords(values)
  )
}

/**
 * Create a change request record for a TXT
 *
 * @param name {string} the DNS name for the record
 * @param values {Array} of record values
 * @returns {object} ResourceRecord change request
 */
function addTXT(name, values) {
  return createChangeRequest(
    'CREATE',
    name,
    'TXT',
    createChangeRequestRecords(values)
  )
}

/**
 * Create a change request record to delete a TXT
 *
 * @param name {string} the DNS name for the record
 * @param values {Array} of record values
 * @returns {object} ResourceRecord change request
 */
function deleteTXT(name, values) {
  /**
   * If we got an array of strings.  Only here because we feed this function
   * results from a query, which is an array of ResourceRecord objects
   */
  if (
    values &&
    values instanceof Array &&
    values.length > 0 &&
    typeof values[0] === 'string'
  ) {
    createChangeRequestRecords(values)
  }

  return createChangeRequest('DELETE', name, 'TXT', values)
}

/**
 * Get a specific Zone
 *
 * Ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Route53.html#listHostedZonesByName-property
 *
 * @param {string} name of DNS record
 * @returns {zone}
 */
async function getZone(client, DNSName) {
  DNSName = append(DNSName, '.')

  const resp = await client
    .listHostedZonesByName({
      DNSName,
      MaxItems: '100'
    })
    .promise()

  const { HostedZones: zones } = resp

  for (let i = 0; i < zones.length; i++) {
    const dnsName = zones[i].Name
    if (dnsName === DNSName) {
      return zones[i]
    }
  }
  return null
}

/**
 * Get a specific zone record
 *
 * Ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Route53.html#listResourceRecordSets-property
 *
 * @param {string} name of DNS record
 * @returns {zone}
 */
async function getRecord(client, zoneObj, DNSName, type) {
  const { ResourceRecordSets } = await client
    .listResourceRecordSets({
      HostedZoneId: zoneObj.Id,
      StartRecordName: DNSName,
      StartRecordType: type
    })
    .promise()

  if (!ResourceRecordSets) {
    return null
  }

  // The Start* functions above are ordering only
  for (const rec of ResourceRecordSets) {
    if (rec.Name === DNSName && rec.Type === type) {
      return rec
    }
  }

  return null
}

/**
 * Try and resolve the known zone by the given name
 *
 * @param args {object}
 * @param args.credentials {object} credentials - The JSON AWS account credentials
 * @param args.DNSName {string} name of DNS zone
 * @returns {boolean} if a zone exists
 */
async function resolveZone({ credentials, DNSName }) {
  const client = getClient(credentials)
  const nameParts = DNSName.split('.')
  let zone = null
  while (nameParts.length >= 2) {
    zone = await getZone(client, nameParts.join('.'))
    if (zone) return zone
    // Knock one of the front
    nameParts.shift()
  }
  return null
}

/**
 * Check if a zone exists on Route53 and we know about it
 *
 * Ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Route53.html#listResourceRecordSets-property
 *
 * @param args {object}
 * @param args.credentials {object} credentials - The JSON AWS account credentials
 * @param args.DNSName {string} name of DNS zone
 * @returns {boolean} if a zone exists
 */
async function addRecord({ credentials, zone, type, name, value }) {
  const client = getClient(credentials)

  // Lookup and verify zone
  const zoneObj = await getZone(client, zone)
  if (!zoneObj) {
    log.error(`Zone ${zone} not found.`)
    return
  }

  const existingA = await getRecord(client, zoneObj, name, 'A')
  const existingCNAME = await getRecord(client, zoneObj, name, 'CNAME')
  const existingTXT = await getRecord(client, zoneObj, name, 'TXT')
  const changes = []

  // Delete conflicting records if they exist
  if (existingA) {
    changes.push(deleteA(name, existingA.value))
  }
  if (existingCNAME) {
    changes.push(deleteCNAME(name, [existingCNAME.value]))
  }
  if (existingTXT) {
    changes.push(deleteTXT(name, existingTXT))
  }

  if (type === 'A') {
    changes.push(await addA(name, [value]))
  } else if (type === 'CNAME') {
    changes.push(await addCNAME(name, [value]))
  } else if (type === 'TXT') {
    changes.push(await addTXT(name, [value]))
  } else {
    throw new Error(`Record type ${type} is not supported`)
  }

  // Create the atomic change batch
  const params = {
    ChangeBatch: {
      Changes: changes,
      Comment: `Automated change for ${zone} by Dshop backend ${+new Date()}`
    },
    HostedZoneId: zoneObj.Id
  }

  // Execute the change batch
  await client.changeResourceRecordSets(params).promise()
}

/**
 * Set the necessary DNS records for a shop to a subdomain controlled by
 * Route53.
 *
 * Ref: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Route53.html
 *
 * @param {object} args
 * @param {string} args.credentials - The JSON AWS account credentials
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
  const client = getClient(credentials)

  // Lookup and verify zone
  const zoneObj = await getZone(client, zone)
  if (!zoneObj) {
    log.error(`Zone ${zone} not found.`)
    return
  }

  // Look for existing record
  const record = append(`${subdomain}.${zone}`, '.')
  const txtRecord = append(`_dnslink.${record}`, '.')
  const txtRecordValue = hash ? `"dnslink=/ipfs/${hash}"` : null
  const existingA = await getRecord(client, zoneObj, record, 'A')
  const existingCNAME = await getRecord(client, zoneObj, record, 'CNAME')
  const existingTXT = await getRecord(client, zoneObj, txtRecord, 'TXT')
  const changes = []

  // Delete records if they exist
  if (existingA && ipAddresses) {
    changes.push(deleteA(record, ipAddresses))
  }
  if (existingCNAME && ipfsGateway) {
    changes.push(
      deleteCNAME(
        record,
        existingCNAME.ResourceRecords.map((rr) => rr.Value)
      )
    )
  }
  if (existingTXT) {
    changes.push(deleteTXT(txtRecord, existingTXT.ResourceRecords))
  }

  // Create the new ones
  if (ipAddresses) {
    changes.push(addA(record, ipAddresses))
  } else if (ipfsGateway) {
    // Use given CNAME, otherwise assume IPFS gateway is serving
    changes.push(addCNAME(record, [append(cname ? cname : ipfsGateway, '.')]))
  } else {
    throw new Error('Unable to create an A or CNAME record. Lacking info!')
  }

  if (txtRecordValue) {
    changes.push(addTXT(txtRecord, [txtRecordValue]))
  }

  // Create the atomic change batch
  const params = {
    ChangeBatch: {
      Changes: changes,
      Comment: `Automated change for ${zone} by Dshop backend ${+new Date()}`
    },
    HostedZoneId: zoneObj.Id
  }

  // Execute the change batch
  await client.changeResourceRecordSets(params).promise()
}

module.exports = { setRecords, resolveZone, addRecord }
