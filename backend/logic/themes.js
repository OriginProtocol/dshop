const fs = require('fs')
const path = require('path')
const { THEMES_CACHE, IS_PROD } = require('../utils/const')

let CACHED_LIST

/**
 * Reads data of each theme in themes/ directory
 * and returns the list
 */
const getAllThemesData = () => {
  return fs
    .readdirSync(THEMES_CACHE)
    .map((file) => path.join(THEMES_CACHE, file))
    .filter((absPath) => fs.statSync(absPath).isDirectory())
    .map((dir) => {
      const metaData = JSON.parse(fs.readFileSync(path.join(dir, 'theme.json')))

      return {
        ...metaData
      }
    })
    .filter((data) => !data.disabled)
}

/**
 * Returns themes data from cache if available,
 * If not, fetches and stores into cache before returning
 */
const getAvailableThemes = () => {
  // Disable cache in dev environment
  if (!IS_PROD) return getAllThemesData()

  if (!CACHED_LIST) CACHED_LIST = getAllThemesData()

  return CACHED_LIST
}

module.exports = {
  getAvailableThemes
}
