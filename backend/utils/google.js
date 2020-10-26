/**
 * Some helpers to make raw Google API requests when SDKs do not implement
 * endpoints.  Generally, you should use the nodejs libraries for the service
 * you're interacting with.
 *
 * https://github.com/googleapis/google-auth-library-nodejs
 *
 * Usage
 * =====
 * const client = await getAuthenticatedClient(jsonCreds)
 * const res = await client.request(`https://dns.googleapis.com/dns/v1/projects/${projectId}`)
 */
const { GoogleAuth } = require('google-auth-library')

const serviceEndpoint = 'https://compute.googleapis.com'
const endpoints = {
  backendBuckets: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/backendBuckets`,
  urlMaps: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/urlMaps`,
  globalAddresses: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/addresses`,
  globalForwardingRules: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/forwardingRules`,
  targetHttpProxies: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/targetHttpProxies`,
  targetHttpsProxies: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/targetHttpsProxies`,
  sslCertificates: `${serviceEndpoint}/compute/v1/projects/PROJECT_ID/global/sslCertificates`
}

function endpoint(projectId, name, suffix) {
  let e = endpoints[name].replace('PROJECT_ID', projectId)
  if (suffix) {
    suffix = suffix.startsWith('/') ? suffix : `/${suffix}`
    e = `${e}${suffix}`
  }
  return e
}

async function getAuthenticatedClient(credentials) {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/compute'],
    credentials
  })
  return await auth.getClient()
}

module.exports = {
  endpoint,
  getAuthenticatedClient
}
