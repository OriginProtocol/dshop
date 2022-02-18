const { isConfigured } = require('@origin/dshop-validation/matrix')

const {
  setRecords: setCloudflareRecords
} = require('../../utils/dns/cloudflare')
const { setRecords: setCloudDNSRecords } = require('../../utils/dns/clouddns')
const { setRecords: setRoute53Records } = require('../../utils/dns/route53')
const { AWS_MARKETPLACE_DEPLOYMENT } = require('../../utils/const')
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
  ipAddresses,
  cname
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
        cname,
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
        cname,
        ipAddresses
      })
    }
  } else if (resourceSelection.includes('aws-dns')) {
    if (
      !AWS_MARKETPLACE_DEPLOYMENT &&
      !isConfigured(networkConfig, 'aws-dns')
    ) {
      log.warn('AWS DNS Provider selected but not available!')
    } else {
      await setRoute53Records({
        ipfsGateway: backendHost,
        zone,
        subdomain,
        hash,
        credentials: AWS_MARKETPLACE_DEPLOYMENT
          ? null
          : {
              accessKeyId: networkConfig.awsAccessKeyId,
              secretAccessKey: networkConfig.awsSecretAccessKey
            },
        cname,
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
