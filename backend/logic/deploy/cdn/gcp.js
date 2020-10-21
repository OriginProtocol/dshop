/**
 * Cloud CDN configuration resources.
 *
 * Notes
 * =====
 * This is convoluted as shit and the regular UI does not relate to the
 * API-level resources really at all.  They use different terms and if you're
 * used to the Web console UI, nothing makes sense.  Here's a rough correlation
 * between resources
 *
 * UI Name                        | API Resource
 * -------------------------------+---------------------------------------------
 * Load balancer                  | A collection of resouces (below)
 * LB Frontend                    | globalAddress + forwardingRules + proxies
 * LB Backend                     | For our case, backendBucket, but can also be
 *                                | backendService
 */
const _find = require('lodash/find')

const { NETWORK_ID_TO_NAME, SERVICE_PREFIX } = require('../../../utils/const')
const google = require('../../../utils/google')
const { assert } = require('../../../utils/validators')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.cdn.gcp')

// Time to wait between checks to see if a resource is ready
const WAIT_INTERVAL = 1000
// How many intervals until we decide something went wrong
const WAIT_INTERVALS_MAX = 10

let projectId = null
let cachedRestClient = null

async function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(), timeout))
}

/**
 * Check if GCP is configured and we can deploy to it
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @returns {bool} - if we can deploy
 */
function isAvailable({ networkConfig }) {
  return !!networkConfig.gcpCredentials
}

/**
 * Configure this singleton for a use
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @param args.credentials {Object} - GCP credentials (if networkConfig not provided)
 */
async function configure({ networkConfig, credentials }) {
  let creds = credentials ? credentials : networkConfig.gcpCredentials

  if (typeof creds === 'string') {
    creds = JSON.parse(creds)
  }

  projectId = creds.project_id

  cachedRestClient = await google.getAuthenticatedClient(creds)
}

/**
 * Configure CDN to point to bucket
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @param args.shop {Object} - Shop model instance
 * @param args.bucketName {string} - name of Google Cloud Storage bucket
 */
async function configureCDN({ shop, deployment, domains }) {
  assert(!!projectId, 'Call configure() first')

  const rest = getRestClient()
  const networkName =
    shop.networkId in NETWORK_ID_TO_NAME
      ? NETWORK_ID_TO_NAME[shop.networkId]
      : 'localhost'
  const serviceName = `${SERVICE_PREFIX}${networkName}-${shop.authToken}`

  if (!deployment.bucketUrls) {
    log.warn(`No bucket URLs found in deployment`)
    return
  }

  const urls = deployment.bucketUrls.split(',').map((u) => new URL(u))
  const bucketUrl = _find(urls, (o) => o.protocol === 'gs:')

  if (!bucketUrl) {
    log.warn(`No GCS bucket URL found in deployment`)
    return
  }

  const bucketName = bucketUrl.hostname

  /**
   * The backendBuckets is basically a service specifically for use with a GCS
   * bucket.  Creating this does not create the bucket, just the service
   * abstraction.
   */
  let backendBucket = await getBackendBucket(rest, serviceName)
  let backendBucketLink

  if (backendBucket) {
    backendBucketLink = backendBucket.selfLink
  } else {
    backendBucket = await createBackendBucket(rest, bucketName, serviceName)

    if (!backendBucket) {
      throw new Error('Attempt to create a backendBucket failed')
    }

    backendBucketLink = backendBucket.selfLink
  }

  /**
   * urlMap used by targetHttp(s)Proxies to figure out how to route traffic.
   * Ours is basically wildcards direct to the bucket backend.
   */
  let urlMap = await getUrlMap(rest, serviceName)
  if (!urlMap) {
    urlMap = await createUrlMap(rest, backendBucketLink, serviceName)
  }

  /**
   * Certificate that will be used by the targetHttpsProxies
   */
  let cert = await getSSLCertificate(rest, serviceName)
  if (!cert) {
    cert = await createSSLCertificate(rest, serviceName, domains)
  }

  /**
   * We need a proxy for both HTTP and HTTPS
   */
  let proxy = await getHttpProxy(rest, serviceName)
  let sproxy = await getHttpsProxy(rest, serviceName)
  if (!proxy) {
    proxy = await createHttpProxy(rest, serviceName, urlMap.selfLink)
  }
  if (!sproxy) {
    sproxy = await createHttpsProxy(rest, serviceName, urlMap.selfLink, [
      cert.selfLink
    ])
  }

  /**
   * We need an address for the forwarding rules to listen on
   */
  let ipAddressRes = await getGlobalAddress(rest, serviceName)
  if (!ipAddressRes) {
    ipAddressRes = await createGlobalAddress(rest, serviceName)
  }

  /**
   * Crete the global forwarding rules to direct traffic from an IP to a proxy.
   * These together are effectively what "frontend" means in the Web console.
   */
  const httpName = `${serviceName}-http`
  const httpsName = `${serviceName}-https`
  const httpsRulesRes = await getForwardingRules(rest, httpsName)
  const httpRulesRes = await getForwardingRules(rest, httpName)
  if (!httpsRulesRes) {
    await createForwardingRules(
      rest,
      httpsName,
      ipAddressRes.address,
      '443-443',
      sproxy.selfLink
    )
  }
  if (!httpRulesRes) {
    await createForwardingRules(
      rest,
      httpName,
      ipAddressRes.address,
      '80-80',
      proxy.selfLink
    )
  }

  // Leaving this as an object for potential addition of more data
  return {
    ipAddress: ipAddressRes.address
  }
}

/**
 * Find a backendBucket with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the backendBucket we're looking for
 * @returns {object} of a specific backendBucket from response
 */
async function getBackendBucket(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'backendBuckets')
  })
}

/**
 * Create a backendBucket with name for bucketName
 *
 * @param client {object} REST client with Oauth
 * @param bucketName {string} name of the bucket
 * @param name {string} name of the backendBucket we're creating
 * @returns {object} of data in response
 */
async function createBackendBucket(client, bucketName, name) {
  const result = await create({
    client,
    url: google.endpoint(projectId, 'backendBuckets'),
    data: {
      name,
      description: `Dshop backend bucket for ${name}`,
      bucketName,
      enableCdn: true
    }
  })
  return await get({ client, url: result.data.targetLink })
}

/**
 * Get a UrlMap with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the backendBucket we're creating
 * @returns {object} of a UrlMap if in response
 */
async function getUrlMap(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'urlMaps')
  })
}

/**
 * Create a UrlMap with name for backendBucketLink
 *
 * @param client {object} REST client with Oauth
 * @param backendBucketLink {string} Google API reflink for backendBucket
 * @param name {string} name of the backendBucket we're creating
 * @returns {object} of a UrlMap if in response
 */
async function createUrlMap(client, backendBucketLink, name) {
  assert(!!backendBucketLink, 'backendBucketLink missing for createUrlMap')
  const result = await create({
    client,
    url: google.endpoint(projectId, 'urlMaps'),
    data: {
      name,
      description: `Dshop backend bucket for ${name}`,
      defaultService: backendBucketLink,
      hostRules: {
        hosts: ['*'],
        pathMatcher: 'allpaths'
      },
      pathMatcher: [
        {
          name: 'allpaths',
          defaultService: backendBucketLink,
          pathRules: [
            {
              service: backendBucketLink,
              paths: ['/*']
            }
          ]
        }
      ]
    }
  })
  return await get({ client, url: result.data.targetLink })
}

/**
 * Get a forwardingRules
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @returns {object} of a forwardingRules if in response
 */
async function getForwardingRules(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'globalForwardingRules')
  })
}

/**
 * Create forwardingRules
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @param ipAddress {string} ipAddress the forwarding rules will listen on
 * @param portRange {string} port range to listen on (e.g. 80-80, 8080-8081)
 * @param target {string} ref URL to a proxy
 * @returns {object} of a forwardingRules if in response
 */
async function createForwardingRules(
  client,
  name,
  ipAddress,
  portRange,
  target
) {
  const result = await create({
    client,
    url: google.endpoint(projectId, 'globalForwardingRules'),
    data: {
      name,
      description: `Dshop backend forwardingRules for ${name}`,
      IPAddress: ipAddress,
      IPProtocol: 'TCP',
      portRange,
      target,
      loadBalancingScheme: 'EXTERNAL'
    }
  })
  return await get({ client, url: result.data.targetLink })
}

/**
 * Get a globalAddress with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @returns {object} of a globlaAddress if in response
 */
async function getGlobalAddress(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'globalAddresses')
  })
}

/**
 * Create a globalAddress with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @returns {object} of a globlaAddress if in response
 */
async function createGlobalAddress(client, name) {
  const result = await create({
    client,
    url: google.endpoint(projectId, 'globalAddresses'),
    data: {
      name,
      description: `IP for ${name}`,
      ipVersion: 'IPV4',
      purpose: 'EXTERNAL'
    }
  })
  return await get({ client, url: result.data.targetLink })
}

/**
 * Get a targetHttpProxy with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the targetHttpProxy we're looking for
 * @returns {object} of a targetHttpProxy if in response
 */
async function getHttpProxy(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'targetHttpProxies')
  })
}

/**
 * Create a targetHttpProxy with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the targetHttpProxy we're looking for
 * @param urlMap {string} ref URL to a urlMap
 * @returns {object} of a targetHttpProxy if in response
 */
async function createHttpProxy(client, name, urlMap) {
  assert(!!urlMap, 'urlMap must be provided')

  const result = await create({
    client,
    url: google.endpoint(projectId, 'targetHttpProxies'),
    data: {
      name,
      description: `targetHttpProxies for ${name}`,
      urlMap
    }
  })

  return await get({ client, url: result.data.targetLink })
}

/**
 * Get a targetHttpsProxies with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the targetHttpsProxy we're looking for
 * @returns {object} of a targetHttpsProxy if in response
 */
async function getHttpsProxy(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'targetHttpsProxies')
  })
}

/**
 * Create a targetHttpsProxies with name and urlMap
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @param urlMap {string} ref URL for a urlMap REST object
 * @param sslCertificates {array<string>} of sslCertificate ref URLs the proxy should use
 * @returns {object} of a targetHttpsProxy if in response
 */
async function createHttpsProxy(client, name, urlMap, sslCertificates) {
  assert(!!urlMap, 'urlMap must be provided')

  const result = await create({
    client,
    url: google.endpoint(projectId, 'targetHttpsProxies'),
    data: {
      name,
      description: `targetHttpsProxies for ${name}`,
      urlMap,
      sslCertificates
    }
  })

  return await get({ client, url: result.data.targetLink })
}

/**
 * Get a sslCertificate with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the sslCertificate we're looking for
 * @returns {object} of a sslCertificate if in response
 */
async function getSSLCertificate(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'sslCertificates')
  })
}

/**
 * Create a sslCertificate with name, for domains
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the SSL certificate object
 * @param domains {array} of domains the cert should be valid for
 * @returns {object} of a sslCertificate if in response
 */
async function createSSLCertificate(client, name, domains) {
  assert(!!domains, 'domains must be provided')

  const result = await create({
    client,
    url: google.endpoint(projectId, 'sslCertificates'),
    data: {
      name,
      description: `sslCertificate for ${name}`,
      type: 'MANAGED',
      managed: {
        domains
      }
    }
  })

  return await get({ client, url: result.data.targetLink })
}

/**
 * GET a specific REST endpoint
 *
 * @param args {object}
 * @param args.client {GoogleAuth} client
 * @param args.url {string} object endpoint we're POSTing to
 * @returns {object} REST object, if found
 */
async function get({ client, url }) {
  assert(!!projectId, 'Call configure() first')
  assert(!!client, 'client must be provided')
  assert(!!url, 'url must be provided')
  const res = await client.request({ url })
  return res.data
}

/**
 * Find a specific object from a listing endpoint
 *
 * @param args {object}
 * @param args.client {GoogleAuth} client
 * @param args.url {string} object endpoint we're POSTing to
 * @param args.name {string} The unique object name to look for
 * @returns {object} REST object, if found
 */
async function find({ client, url, name }) {
  const { items } = await get({ client, url })
  log.debug(`found items: `, items)
  return _find(items, (i) => i.name === name)
}

/**
 * Create an object, returning the response, which includes an Operation object.
 * An Operation is more or less like an async transaction for Google API. If the
 * Operation is still running, it will have a status of 'RUNNING' and if
 * successfully completed, 'DONE'
 *
 * @param args {object}
 * @param args.client {GoogleAuth} client
 * @param args.url {string} object endpoint we're POSTing to
 * @param args.data {object} data (object props) to send to the endpoint
 * @param args.method {string} HTTP method to use (default: POST)
 * @returns {object} Operation object
 */
async function create({ client, url, data, method = 'POST' }) {
  assert(!!projectId, 'Call configure() first')
  assert(!!client, 'client must be provided')
  assert(!!url, 'url must be provided')
  assert(!!data, 'data must be provided')

  const res = await client.request({ url, method, data })
  if (res.data.status !== 'RUNNING') {
    throw new Error(`Unexpected status when trying to POST ${url}`)
  }

  log.debug(`created: `, res.data)
  log.info(`Waiting for ${res.data.selfLink} to become ready...`)

  // Wait for the Operation to be `DONE`
  try {
    return await waitFor(client, res.data.selfLink)
  } catch (err) {
    log.error(err)
  }

  log.error(`${res.data.selfLink} did not become ready!  Falling back`)

  // Return what we have in hopes it's enough
  return res
}

/**
 * Wait for a REST Operation to become status.
 *
 * @param client {GoogleAuth} client
 * @param url {string} ref URL for the Operation object we're waiting for
 * @param status {string} an Operation status enum value (default: DONE)
 * @returns {object} Operation object
 */
async function waitFor(client, url, status = 'DONE') {
  for (let i = 0; i < WAIT_INTERVALS_MAX; i++) {
    await sleep(WAIT_INTERVAL)

    const checkRes = await client.request({
      url
    })

    log.debug(
      `${url} status: ${
        checkRes && checkRes.data ? checkRes.data.status : 'unavailable'
      }`
    )

    if (checkRes && checkRes.data && checkRes.data.status === status) {
      return checkRes
    }
  }

  throw new Error(`Resource did not become ready in time: ${url}`)
}

/**
 * Get a cached, authenticated REST gaxios client
 *
 * @returns {GoogleAuth} client
 */
function getRestClient() {
  if (cachedRestClient !== null) return cachedRestClient
  throw new Error('Call configure() first')
}

module.exports = { isAvailable, configure, configureCDN }
