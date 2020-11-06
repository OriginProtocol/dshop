/**
 * CDN configuration module
 *
 * Sub-Modules
 * ===========
 * Sub-modules implement different providers (e.g. GCP, AWS). Every CDN
 * configuration module in this directory should conform to this minimum API:
 *
 * - isAvailable({ networkConfig }) -> bool - If the module can be used
 * - configure({ networkConfig, credentials }) - Called to allow the module to configure its singleton
 * - configureCDN({ shop, deployment, domains }) -> CDNConfigurationObject - Configure CDN to serve a bucket
 *
 * CDNConfigurationObject
 * ==================
 * {
 *    ipAddress: "12.34.56.78" // the global IP address of the CDN endpoint
 * }
 *
 */
const { getModules, loadModule } = require('../../../utils/module')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.cdn')

async function configureCDN({
  networkConfig,
  resourceSelection,
  shop,
  deployment,
  domains
}) {
  const responses = []
  const modules = await getModules(__dirname)

  for (const modName of modules) {
    const mod = loadModule(__dirname, modName)

    // Check if it's usable for deployment
    if (mod.isAvailable({ networkConfig, resourceSelection })) {
      await mod.configure({ networkConfig })
      responses.push(await mod.configureCDN({ shop, deployment, domains }))
    } else {
      log.debug(`${modName} bucket deployer is not available or configured`)
    }
  }

  return responses
}

module.exports = { configureCDN }
