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
const trimStart = require('lodash/trimStart')
const { isConfigured } = require('@origin/dshop-validation/matrix')

const { NETWORK_ID_TO_NAME, SERVICE_PREFIX } = require('../../../utils/const')
const google = require('../../../utils/google')
const { allIn } = require('../../../utils/array')
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
function isAvailable({ networkConfig, resourceSelection }) {
  return (
    resourceSelection.includes('gcp-cdn') &&
    isConfigured(networkConfig, 'gcp-cdn')
  )
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
  const serviceName = `${SERVICE_PREFIX}${networkName}-${shop.shopSlug}`

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
  if (urlMap) {
    log.info(`Invalidating cache for urlMap ${serviceName}`)
    await invalidateCache(rest, serviceName, [
      '/*',
      `/${shop.shopSlug}/*`,
      `/dist/*`
    ])
  } else {
    urlMap = await createUrlMap(rest, backendBucketLink, serviceName)
  }

  /**
   * Certificate that will be used by the targetHttpsProxies
   */
  let certUpdate = false
  let cert
  const certs = await getSSLCertificates(rest, serviceName)

  if (certs) {
    const latestCertName = lastSortedName(certs.map((c) => c.name))
    cert = _find(certs, (c) => c.name === latestCertName)
  }

  if (!cert || !cert.managed || !allIn(cert.managed.domains, domains)) {
    // Cleanup the old certs, but not the last
    if (certs && certs.length > 2) {
      for (const c of certs.filter((c) => c.name !== cert.name)) {
        log.info(`Deleting old certificate ${c.name}`)
        deleteSSLCertificate(rest, c.name)
      }
    }

    const certName = cert ? incrementName(cert.name, serviceName) : serviceName
    cert = await createSSLCertificate(rest, certName, domains)
    certUpdate = true
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
  } else if (certUpdate) {
    /**
     * This sucks.  We can't just update the cert because of what looks like an
     * implementation error on Google's part.  Leaving the code here in hopes it
     * will one day be useful.
     *
     * Instead, we have to create a new httpsProxy, and replace the proxy on the
     * forwardingRules later down.
     */
    /*sproxy = await setHttpsProxyCerts(rest, serviceName, [
      cert.selfLink
    ])*/
    const sproxies = await getHttpsProxies(rest, serviceName)
    const latestSproxyName = sproxies
      ? lastSortedName(sproxies.map((c) => c.name))
      : serviceName
    if (sproxies.length > 2) {
      for (const sp of sproxies.filter((s) => s.name !== latestSproxyName)) {
        deletHttpsProxy(rest, sp.name)
      }
    }

    const newSproxyName = incrementName(latestSproxyName, serviceName)
    sproxy = await createHttpsProxy(rest, newSproxyName, urlMap.selfLink, [
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
  } else if (certUpdate) {
    await updateForwardingRulesTarget(rest, httpsName, sproxy.selfLink)
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
 * Invalidate a urlMap cache
 *
 * @param client {object} REST client with Oauth
 * @param urlMapName {string} name (resource ID) of the urlMap
 * @param paths {Array<string>} paths to invalidate (starting with /)
 */
async function invalidateCache(client, urlMapName, paths) {
  for (const pth of paths) {
    await post({
      client,
      url: google.endpoint(
        projectId,
        'urlMaps',
        `${urlMapName}/invalidateCache`
      ),
      data: {
        path: pth
      }
    })
  }
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
 * Update forwardingRules target
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @param target {string} ref URL to a proxy
 * @returns {object} of a forwardingRules if in response
 */
async function updateForwardingRulesTarget(client, name, target) {
  const result = await create({
    client,
    url: google.endpoint(
      projectId,
      'globalForwardingRules',
      `${name}/setTarget`
    ),
    data: {
      target
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
 * Get a targetHttpsProxies with name
 *
 * @param client {object} REST client with Oauth
 * @param base {string} base name of the targetHttpsProxy we're looking for
 * @returns {object} of a targetHttpsProxy if in response
 */
async function getHttpsProxies(client, base) {
  return await findIncrementalNames({
    client,
    base,
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
  assert(!!sslCertificates, 'sslCertificates must be provided')

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
 * Delete a targetHttpsProxies with name
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @returns {object} Operation
 */
async function deletHttpsProxy(client, name) {
  assert(!!name, 'name must be provided')

  return await post({
    client,
    url: google.endpoint(projectId, 'targetHttpsProxies', `${name}`),
    method: 'DELETE'
  })
}

/**
 * Update a targetHttpsProxies with new SSL certs
 *
 * NOTE: While I think this should work, it does not.  Looks like an endpoint
 * they forgot to implement.  The documentation suggests this should have been
 * implemented on the global endpoint, the doc page actually shows the regional
 * endpoint instead.  Seems to be a bug, like a copy & paste error.  So, I will
 * leave this here in the hopes that it will one day be implemented.   In the
 * mean time, it looks like we have to recreate the proxy.
 *
 * Ref: https://cloud.google.com/compute/docs/reference/rest/v1/targetHttpsProxies/setSslCertificates
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the globalAddress we're looking for
 * @param urlMap {string} ref URL for a urlMap REST object
 * @param sslCertificates {array<string>} of sslCertificate ref URLs the proxy should use
 * @returns {object} of a targetHttpsProxy if in response
 */
// eslint-disable-next-line no-unused-vars
async function setHttpsProxyCerts(client, name, sslCertificates) {
  assert(false, 'setHttpsProxyCerts can not be used')
  assert(!!sslCertificates, 'sslCertificates must be provided')

  const result = await create({
    client,
    url: google.endpoint(
      projectId,
      'targetHttpsProxies',
      `${name}/setSslCertificates`
    ),
    data: {
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
// eslint-disable-next-line no-unused-vars
async function getSSLCertificate(client, name) {
  return await find({
    client,
    name,
    url: google.endpoint(projectId, 'sslCertificates')
  })
}

/**
 * Get a sslCertificate with name
 *
 * @param client {object} REST client with Oauth
 * @param base {string} base name of the sslCertificate we're looking for
 * @returns {object} of a sslCertificate if in response
 */
async function getSSLCertificates(client, base) {
  return await findIncrementalNames({
    client,
    base,
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
 * Create a sslCertificate with name, for domains
 *
 * @param client {object} REST client with Oauth
 * @param name {string} name of the SSL certificate object
 * @param domains {array} of domains the cert should be valid for
 * @returns {object} of a sslCertificate if in response
 */
async function deleteSSLCertificate(client, name) {
  assert(!!name, 'name must be provided')

  return await post({
    client,
    method: 'DELETE',
    url: google.endpoint(projectId, 'sslCertificates', name)
  })
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
  return _find(items, (i) => i.name === name)
}

/**
 * Find a specific object from a listing endpoint
 *
 * @param args {object}
 * @param args.client {GoogleAuth} client
 * @param args.url {string} object endpoint we're POSTing to
 * @param args.base {string} The base object name to look for
 * @returns {object} REST object, if found
 */
async function findIncrementalNames({ client, url, base }) {
  const { items } = await get({ client, url })
  return items.filter((i) => incrementalNameMatch(base, i.name))
}

/**
 * POST to a specific REST endpoint
 *
 * @param args {object}
 * @param args.client {GoogleAuth} client
 * @param args.url {string} object endpoint we're POSTing to
 * @param args.body {object} JSON object to send to the endpoint
 * @returns {object} Operation object
 */
async function post({ client, url, data, method = 'POST' }) {
  assert(!!projectId, 'Call configure() first')
  assert(!!client, 'client must be provided')
  assert(!!url, 'url must be provided')
  if (method === 'POST') assert(!!data, 'data must be provided')
  const res = await client.request({ url, method, data })
  return res.data
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
 * @returns {object} Operation object
 */
async function create({ client, url, data }) {
  assert(!!projectId, 'Call configure() first')
  assert(!!client, 'client must be provided')
  assert(!!url, 'url must be provided')
  assert(!!data, 'data must be provided')

  const res = await client.request({ url, method: 'POST', data })
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

/**
 * Find last name of sorted array of names (e.g. name, name-1, name-2, etc)
 *
 * @param names {Array<string>} array of incremental names
 * @returns {string} "latest" name
 */
function lastSortedName(names) {
  return names.sort().slice(names.length - 1)[0]
}

/**
 * Increment the suffix of a name (e.g. name becomes name-1, name-2 becomse
 * name-3, etc)
 *
 * @param names {string} name to increment
 * @returns {string} incremented name
 */
function incrementName(name, baseName) {
  const strSuffix = trimStart(name.replace(baseName, ''), '-')
  let suffix = 0
  if (strSuffix && !Number.isNaN(Number(strSuffix))) {
    suffix = Number(strSuffix) + 1
  }
  return `${baseName}-${suffix}`
}

/**
 * Check if a name matches the expected incremental pattern.  For example:
 * origin-1, origin-2, ... origin-12
 *
 * @param baseName {string} The expected base name, minus the incremental bit
 * @param name {string} The name to check against
 * @returns {boolean} if it's a match
 */
function incrementalNameMatch(baseName, name) {
  if (baseName === name) return true
  const pat = new RegExp(`^${baseName}-([0-9]+)$`)
  return !!name.match(pat)
}

module.exports = { isAvailable, configure, configureCDN }
