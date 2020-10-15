/**
 * Utilities for modularizing things.
 */
const fs = require('fs').promises
const path = require('path')

const { isExt, stripExt } = require('./filesystem')

const DEFAULT_FILE_EXCLUDES = ['index.js']

const cachedModules = {}

/**
 * Return filenames without extension for files in directory excluding excludes
 *
 * @param excludes {string[]} - Array of strings of filenames to exclude
 * @returns {Array} of module names
 */
async function getModules(dirPath, excludes = DEFAULT_FILE_EXCLUDES) {
  const files = await fs.readdir(dirPath)
  const mods = []
  for (const e of files) {
    if (excludes.includes(e)) continue
    const fqname = path.join(dirPath, e)
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
 * @param modName {string} - Name of module
 * @returns {object} imported nodejs module
 */
function loadModule(dirPath, modName) {
  if (!cachedModules[dirPath]) cachedModules[dirPath] = {}
  if (modName in cachedModules[dirPath]) {
    return cachedModules[dirPath][modName]
  }
  cachedModules[dirPath][modName] = require(path.join(dirPath, modName))
  return cachedModules[dirPath][modName]
}

module.exports = {
  getModules,
  loadModule
}
