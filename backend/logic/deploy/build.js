const fs = require('fs')
const { execFile } = require('child_process')

const { getLogger } = require('../../utils/logger')

const log = getLogger('logic.deploy.build')

/**
 * Copy all needed files for a shop deployment to the public build directory and
 * replace HTML template vars to prepare for deployment.
 *
 * @param args {object}
 * @param args.network {object} - Network model instance
 * @param args.networkConfig {object} - Decrypted network configuration
 * @param args.shop {object} - Shop model instance
 * @param args.OutputDir {string} - FS location where the shop build output should go
 * @param args.dataDir {string} - FS location of the datadir for the shop
 */
async function assembleBuild({
  network,
  networkConfig,
  shop,
  OutputDir,
  dataDir
}) {
  log.info(`Shop ${shop.id}: Preparing data for deploy...`)
  log.info(`Outputting to ${OutputDir}/public`)
  await new Promise((resolve, reject) => {
    execFile('rm', ['-rf', `${OutputDir}/public`], (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })

  let publicShopConfig = {}
  try {
    const raw = fs.readFileSync(`${OutputDir}/data/config.json`)
    publicShopConfig = JSON.parse(raw.toString())
  } catch (e) {
    log.error(e)
    // Throw something more clear
    throw new Error(`Shop ${shop.id}: failed parsing ${OutputDir}/data/config.json`)
  }

  await new Promise((resolve, reject) => {
    const distDir = publicShopConfig.themeId
      ? `themes/${publicShopConfig.themeId}`
      : 'dist'
    execFile(
      'cp',
      ['-r', `${__dirname}/../../${distDir}`, `${OutputDir}/public`],
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      }
    )
  })

  await new Promise((resolve, reject) => {
    execFile(
      'cp',
      ['-r', `${OutputDir}/data`, `${OutputDir}/public/${dataDir}`],
      (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      }
    )
  })

  const networkName =
    network.networkId === 1
      ? 'mainnet'
      : network.networkId === 4
      ? 'rinkeby'
      : 'localhost'

  function replaceVars(html) {
    return html
      .replace('TITLE', publicShopConfig.fullTitle)
      .replace('META_DESC', publicShopConfig.metaDescription || '')
      .replace('DATA_DIR', dataDir)
      .replace(/NETWORK/g, networkName)
      .replace('FAVICON', publicShopConfig.favicon || 'favicon.ico')
      .replace('UI_SRC', networkConfig.uiCdn || '')
  }

  const html = fs.readFileSync(`${OutputDir}/public/index.html`).toString()
  fs.writeFileSync(`${OutputDir}/public/index.html`, replaceVars(html))

  const cdnHtml = fs.readFileSync(`${OutputDir}/public/cdn.html`).toString()
  fs.writeFileSync(`${OutputDir}/public/cdn.html`, replaceVars(cdnHtml))
}

module.exports = {
  assembleBuild
}
