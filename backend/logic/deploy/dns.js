const setCloudflareRecords = require('../../utils/dns/cloudflare')
const setCloudDNSRecords = require('../../utils/dns/clouddns')
const setRoute53Records = require('../../utils/dns/route53')
const { getConfig } = require('../../utils/encryptedConfig')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.deploy.dns')

async function configureShopDNS({
  network,
  subdomain,
  zone,
  hash,
  dnsProvider
}) {
  const networkConfig = getConfig(network.config)
  const gatewayURL = new URL(network.ipfs)
  const gatewayHost = gatewayURL.hostname

  if (dnsProvider === 'cloudflare') {
    if (!networkConfig.cloudflareApiKey) {
      log.warn('Cloudflare DNS Proider selected but no credentials configured!')
    } else {
      await setCloudflareRecords({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        email: networkConfig.cloudflareEmail,
        key: networkConfig.cloudflareApiKey
      })
    }
  }

  if (dnsProvider === 'gcp') {
    if (!networkConfig.gcpCredentials) {
      log.warn('GCP DNS Proider selected but no credentials configured!')
    } else {
      await setCloudDNSRecords({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        credentials: networkConfig.gcpCredentials
      })
    }
  }

  if (dnsProvider === 'aws') {
    if (!networkConfig.awsAccessKeyId || !networkConfig.awsSecretAccessKey) {
      log.warn('AWS DNS Proider selected but no credentials configured!')
    } else {
      await setRoute53Records({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        credentials: {
          accessKeyId: networkConfig.awsAccessKeyId,
          secretAccessKey: networkConfig.awsSecretAccessKey
        }
      })
    }
  }

  if (!['cloudflare', 'gcp', 'aws'].includes(dnsProvider)) {
    log.error('Unknown DNS provider selected.  Will not configure DNS')
  }
}

module.exports = {
  configureShopDNS
}
