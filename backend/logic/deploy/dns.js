const { isConfigured } = require('@origin/dshop-validation')

const setCloudflareRecords = require('../../utils/dns/cloudflare')
const setCloudDNSRecords = require('../../utils/dns/clouddns')
const setRoute53Records = require('../../utils/dns/route53')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.deploy.dns')

/**
 * Configure DNS to point at either the configured IPFS gateway or ipAddress (if
 * provided)
 *
 * @param args {object}
 * @param args.networkConfig {object} - Decrypted network config
 * @param args.subdomain {string} - Hostname to configure (e.g. 'host' of 'host.example.com')
 * @param args.zone {string} - DNS Zone we're configuring
 * @param args.hash {string} - IPFS hash of deployed shop
 * @param args.dnsProvider {string} - The DNS provider to use
 * @param args.ipAddresses {string} - The IP address if configuring an A record (optional)
 */
async function configureShopDNS({
  networkConfig,
  subdomain,
  zone,
  hash,
  resourceSelection,
  ipAddresses
}) {
  const backendUrl = new URL(networkConfig.backendUrl)
  const backendHost = backendUrl.hostname

  if (resourceSelection.includes('cloudflare-dns')) {
    if (!isConfigured(networkConfig, 'cloudflare-dns')) {
      log.warn('Cloudflare DNS Proider selected but not available!')
    } else {
      await setCloudflareRecords({
        ipfsGateway: backendHost,
        zone,
        subdomain,
        hash,
        email: networkConfig.cloudflareEmail,
        key: networkConfig.cloudflareApiKey,
        ipAddresses
      })
    }
  } else if (resourceSelection.includes('gcp-dns')) {
    if (!isConfigured(networkConfig, 'gcp-dns')) {
      log.warn('GCP DNS Proider selected but not available!')
    } else {
      await setCloudDNSRecords({
        ipfsGateway: backendHost,
        zone,
        subdomain,
        hash,
        credentials: networkConfig.gcpCredentials,
        ipAddresses
      })
    }
  } else if (resourceSelection.includes('aws-dns')) {
    if (!isConfigured(networkConfig, 'aws-dns')) {
      log.warn('AWS DNS Proider selected but not available!')
    } else {
      await setRoute53Records({
        ipfsGateway: backendHost,
        zone,
        subdomain,
        hash,
        credentials: {
          accessKeyId: networkConfig.awsAccessKeyId,
          secretAccessKey: networkConfig.awsSecretAccessKey
        },
        ipAddresses
      })
    }
  } else {
    log.error('Unknown DNS provider selected.  Will not configure DNS')
  }
}

module.exports = {
  configureShopDNS
}
