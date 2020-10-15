const setCloudflareRecords = require('../../utils/dns/cloudflare')
const setCloudDNSRecords = require('../../utils/dns/clouddns')
const setRoute53Records = require('../../utils/dns/route53')
const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.deploy.dns')

/**
 * Copy all needed files for a shop deployment to the public build directory and
 * replace HTML template vars to prepare for deployment.
 *
 * @param args {object}
 * @param args.network {object} - Network model instance
 * @param args.networkConfig {object} - Decrypted network config
 * @param args.subdomain {string} - Hostname to configure (e.g. 'host' of 'host.example.com')
 * @param args.zone {string} - DNS Zone we're configuring
 * @param args.hash {string} - IPFS hash of deployed shop
 * @param args.dnsProvider {string} - The DNS provider to use
 * @param args.ipAddresses {string} - The IP address if configuring an A record (optional)
 */
async function configureShopDNS({
  network,
  networkConfig,
  subdomain,
  zone,
  hash,
  dnsProvider,
  ipAddresses
}) {
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
        key: networkConfig.cloudflareApiKey,
        ipAddresses
      })
    }
  } else if (dnsProvider === 'gcp') {
    if (!networkConfig.gcpCredentials) {
      log.warn('GCP DNS Proider selected but no credentials configured!')
    } else {
      await setCloudDNSRecords({
        ipfsGateway: gatewayHost,
        zone,
        subdomain,
        hash,
        credentials: networkConfig.gcpCredentials,
        ipAddresses
      })
    }
  } else if (dnsProvider === 'aws') {
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
