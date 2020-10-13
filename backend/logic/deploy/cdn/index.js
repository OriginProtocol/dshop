const { getModules, loadModule } = require('../../../utils/module')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.cdn')

async function configureCDN({ networkConfig, shop, deployment, domains }) {
  const responses = []
  const modules = await getModules(__dirname)

  for (const modName of modules) {
    const mod = loadModule(__dirname, modName)

    // Check if it's usable for deployment
    if (mod.isAvailable({ networkConfig })) {
      await mod.configure({ networkConfig })
      responses.push(
        await mod.configureCDN({ shop, deployment, domains })
      )
    } else {
      log.debug(`${modName} bucket deployer is not available or configured`)
    }
  }

  return responses
}

module.exports = { configureCDN }
