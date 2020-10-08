const fs = require('fs').promises
const path = require('path')

const { getLogger } = require('./logger')

const log = getLogger('utils.filesystem')

const MAX_WALK_DEPTH = 10

/**
 * Does the filename have an extension matching ext?
 *
 * @param fname <String> filename to check
 * @param ext <String> extension to look for
 * @returns bool if the filename has an ext extension
 */
function isExt(fname, ext) {
  const parts = fname.split('.')
  if (parts[parts.length - 1] === ext) {
    return true
  }
  return false
}

/**
 * Does the filename have an extension matching ext?
 *
 * @param fname <String> filename to check
 * @param ext <String> extension to look for
 * @returns bool if the filename has an ext extension
 */
function stripExt(fname) {
  if (!fname.includes('.')) {
    return fname
  }
  const parts = fname.split('.')
  parts.pop()
  return parts.join('.')
}

/**
 * Walk a directory recursively and return relative path strings from the
 * directory given.
 *
 * @param dpath {string} - directory to walk
 * @returns {Array} - of relative paths from dpath to all files in dpath
 */
async function walkDir(dpath, depth = 0) {
  let files = []
  const ents = await fs.readdir(dpath)

  for (const i of ents) {
    // Ignore current and parent and hidden files
    if (i.startsWith('.')) continue

    const fqname = path.join(dpath, i)
    const stat = await fs.stat(fqname)

    if (stat.isFile()) {
      files.push(fqname)
    } else if (stat.isDirectory()) {
      if (depth > MAX_WALK_DEPTH) {
        log.warn('Depth exceeds MAX_WALK_DEPTH, skipping directory')
        continue
      }
      const children = await walkDir(fqname, depth + 1)
      files = files.concat(children)
    }
  }
  return files
}

module.exports = {
  isExt,
  stripExt,
  walkDir
}
