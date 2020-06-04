const deploy = require('ipfs-deploy')
const ipfsClient = require('ipfs-http-client')
const fs = require('fs')
const { exec } = require('child_process')

const { ShopDeployment } = require('../models')

const { getConfig } = require('./encryptedConfig')
const prime = require('./primeIpfs')
const setCloudflareRecords = require('./dns/cloudflare')
const setCloudDNSRecords = require('./dns/clouddns')

async function deployShop({
  OutputDir,
  dataDir,
  network,
  subdomain,
  shop,
  pinner,
  dnsProvider
}) {
  const networkConfig = getConfig(network.config)
  const zone = networkConfig.domain

  await new Promise((resolve, reject) => {
    exec(`rm -rf ${OutputDir}/public`, (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })

  await new Promise((resolve, reject) => {
    exec(`cp -r ${__dirname}/../dist ${OutputDir}/public`, (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })

  await new Promise((resolve, reject) => {
    exec(
      `cp -r ${OutputDir}/data ${OutputDir}/public/${dataDir}`,
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      }
    )
  })

  let publicShopConfig = {}
  try {
    const raw = fs.readFileSync(`${OutputDir}/data/config.json`)
    publicShopConfig = JSON.parse(raw.toString())
  } catch (e) {
    /* Ignore */
  }

  const networkName =
    network.networkId === 1
      ? 'mainnet'
      : network.networkId === 4
      ? 'rinkeby'
      : 'localhost'

  const html = fs.readFileSync(`${OutputDir}/public/index.html`).toString()
  fs.writeFileSync(
    `${OutputDir}/public/index.html`,
    html
      .replace('TITLE', publicShopConfig.fullTitle)
      .replace('META_DESC', publicShopConfig.metaDescription || '')
      .replace('DATA_DIR', dataDir)
      .replace('NETWORK', networkName)
      .replace('FAVICON', publicShopConfig.favicon || 'favicon.ico')
  )

  // Deploy the shop to IPFS.
  let hash, ipfsGateway
  const publicDirPath = `${OutputDir}/public`
  if (
    networkConfig.pinataKey &&
    networkConfig.pinataSecret &&
    pinner === 'pinata'
  ) {
    ipfsGateway = 'https://gateway.pinata.cloud'
    hash = await deploy({
      publicDirPath,
      remotePinners: ['pinata'],
      siteDomain: dataDir,
      credentials: {
        pinata: {
          apiKey: networkConfig.pinataKey,
          secretApiKey: networkConfig.pinataSecret
        }
      }
    })
    if (!hash) {
      throw new Error('ipfs-errir')
    }
    console.log(`Deployed shop on Pinata. Hash=${hash}`)
    await prime(`https://gateway.pinata.cloud/ipfs/${hash}`, publicDirPath)
    await prime(`https://gateway.ipfs.io/ipfs/${hash}`, publicDirPath)
    await prime(`https://ipfs-prod.ogn.app/ipfs/${hash}`, publicDirPath)
  } else if (network.ipfsApi.indexOf('localhost') > 0) {
    ipfsGateway = network.ipfs
    const ipfs = ipfsClient(network.ipfsApi)
    const allFiles = []
    const glob = ipfsClient.globSource(publicDirPath, { recursive: true })
    for await (const file of ipfs.add(glob)) {
      allFiles.push(file)
    }
    hash = String(allFiles[allFiles.length - 1].cid)
    console.log(`Deployed shop on local IPFS. Hash=${hash}`)
  } else {
    console.log(
      'Shop not deployed to IPFS: Pinata not configured and not a dev environment.'
    )
  }

  const domain = dnsProvider ? `https://${subdomain}.${zone}` : null
  if (dnsProvider === 'cloudflare' && networkConfig.cloudflareApiKey) {
    await setCloudflareRecords({
      ipfsGateway: 'ipfs-prod.ogn.app',
      zone,
      subdomain,
      hash,
      email: networkConfig.cloudflareEmail,
      key: networkConfig.cloudflareApiKey
    })
  }
  if (dnsProvider === 'gcp' && networkConfig.gcpCredentials) {
    await setCloudDNSRecords({
      ipfsGateway: 'ipfs-prod.ogn.app',
      zone,
      subdomain,
      hash,
      credentials: networkConfig.gcpCredentials
    })
  }

  if (hash) {
    // Record the deployment in the DB.
    const deployment = await ShopDeployment.create({
      shopId: shop.id,
      domain,
      ipfsGateway,
      ipfsHash: hash
    })

    console.log(
      `Recorded shop deployment in the DB. id=${deployment.id} domain=${domain} ipfs=${ipfsGateway} hash=${hash}`
    )
  }

  return { hash, domain }
}

module.exports = { deployShop }
