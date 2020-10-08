const fs = require('fs')
const path = require('path')
const { THEMES_CACHE } = require('../utils/const')

let CACHED_LIST

/**
 * Reads data of each theme in themes/ directory
 * and returns the list
 */
const getAllThemesData = () => {
  return fs.readdirSync(THEMES_CACHE)
    .map(file => path.join(THEMES_CACHE, file))
    .filter(absPath => fs.statSync(absPath).isDirectory())
    .map(dir => {
      const metaData = JSON.parse(fs.readFileSync(path.join(dir, 'theme.json')))

      return {
        ...metaData
      }
    })
}

/**
 * Returns themes data from cache if available,
 * If not, fetches and stores into cache before returning
 */
const getAvailableThemes = () => {
  if (!CACHED_LIST) CACHED_LIST = getAllThemesData()

  return CACHED_LIST
}

module.exports = {
  getAvailableThemes
}