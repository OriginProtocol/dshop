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

const fs = require('fs').promises
const path = require('path')

const { isExt, stripExt } = require('../../../utils/filesystem')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.bucket')

const DEFAULT_FILE_EXCLUDES = ['index.js']

const cachedModules = []

/**
 * Return filenames without extension for files in directory excluding excludes
 *
 * @param excludes <String[]> - Array of strings of filenames to exclude
 * @returns Array of module names
 */
async function getModules(excludes = DEFAULT_FILE_EXCLUDES) {
  const files = await fs.readdir(__dirname)
  const mods = []
  for (const e of files) {
    if (excludes.includes(e)) continue
    const fqname = path.join(__dirname, e)
    const stat = await fs.stat(fqname)
    if (stat.isFile() && isExt(e, 'js')) {
      mods.push(stripExt(e))
    }
  }
  return mods
}

/**
 * Return an imported module
 *
 * @param modName <String> - Name of module
 * @returns imported nodejs module
 */
function loadModule(modName) {
  if (modName in cachedModules) {
    return cachedModules[modName]
  }
  cachedModules[modName] = require(`./${modName}`)
  return cachedModules[modName]
}

/**
 * Deploy shop to a bucket
 *
 * @param args <Object>
 * @param args.networkConfig <Object> - networkConfig object
 * @param args.OutputDir <string> - Output directory the shop build is in
 * @param args.dataDir <string> - The dataDir the shop configuration is in
 * @returns bool? - TODO
 */
async function deployToBucket({ networkConfig, shop, OutputDir, dataDir }) {
  const responses = []
  const modules = await getModules()

  for (const modName of modules) {
    const mod = loadModule(modName)

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
