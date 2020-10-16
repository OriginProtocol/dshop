/**
 * Bucket deployment module
 *
 * Sub-Modules
 * ===========
 * Sub-modules implement different providers (e.g. GCP, AWS). Every bucket
 * deployment module in this directory should conform to this minimum API:
 *
 * - isAvailable({ networkConfig }) -> bool - If the module can be used
 * - configure({ networkConfig }) - Called to allow the module to configure its singleton
 * - deploy({ networkConfig, OutputDir }) -> BucketDeployObject - Deploy OutputDir to a bucket
 *
 * BucketDeployObject
 * ==================
 * {
 *    bucketName: "mybucket", // the name of the bucket deployed to
 *    url: "gs://mybucket/",
 *    httpUrl: "https://storage.googleapis.com/mybucket/"
 * }
 */
const { getModules, loadModule } = require('../../../utils/module')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.bucket')

/**
 * Deploy shop to bucket(s)
 *
 * @param args <Object>
 * @param args.networkConfig <Object> - networkConfig object
 * @param args.OutputDir <string> - Output directory the shop build is in
 * @param args.dataDir <string> - The dataDir the shop configuration is in
 * @returns {Array} of response objects from each available module
 */
async function deployToBucket({ networkConfig, shop, OutputDir, dataDir }) {
  const responses = []
  const modules = await getModules(__dirname)

  for (const modName of modules) {
    const mod = loadModule(__dirname, modName)

    // Check if it's usable for deployment
    if (mod.isAvailable({ networkConfig })) {
      await mod.configure({ networkConfig })
      responses.push(
        await mod.deploy({ networkConfig, shop, OutputDir, dataDir })
      )
    } else {
      log.debug(`${modName} bucket deployer is not available or configured`)
    }
  }

  return responses
}

module.exports = {
  deployToBucket
}
