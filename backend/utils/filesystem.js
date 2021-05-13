const fs = require('fs').promises
const path = require('path')

const { DSHOP_CACHE, DEFAULT_CONTENT_TYPE } = require('./const')
const { getLogger } = require('./logger')

const log = getLogger('utils.filesystem')

const MAX_WALK_DEPTH = 10

/**
 * Does the filename have an extension matching ext?
 *
 * @param fname {string} filename to check
 * @param ext {string} extension to look for
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
 * Remove an extension and joining period from fname
 *
 * @param fname {string} filename to check
 * @returns {string} filename without extension
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
 * Return a filename extension given a filename
 *
 * @param fname {string} filename to parse
 * @returns {string} filename extension
 */
function getExt(fname) {
  if (!fname.includes('.')) {
    return null
  }
  const parts = fname.split('.')
  return parts.pop()
}

/**
 * Guess the HTTP Content-Type of a file by extension
 *
 * @param fname {string} filename to check
 * @returns {string} HTTP Content-Type best guess
 */
function guessContentType(fname) {
  const ext = getExt(fname)

  if (!ext) {
    return DEFAULT_CONTENT_TYPE
  }

  switch (ext) {
    case 'html':
    case 'htm':
      return 'text/html'
    case 'css':
      return 'text/css'
    case 'js':
      return 'text/javascipt'
    case 'svg':
      return 'image/svg+xml'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'woff':
      return 'font/woff'
    case 'woff2':
      return 'font/woff2'
    case 'json':
      return 'application/json'
  }

  return DEFAULT_CONTENT_TYPE
}

/**
 * Walk a directory recursively and return relative path strings from the
 * directory given.
 *
 * @param dpath {string} - directory to walk
 * @param depth {number} - current depth (You probably do not want to use this)
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

/**
 * Check if a given absolute path is within the given allowed paths
 *
 * @param abs {string} - the absolute path to check
 * @param acls {Array<string>} - The allowed safe paths
 */
function isSafePath(abs, acls = [DSHOP_CACHE]) {
  if (!acls || !acls.length) {
    throw new Error('Now FS ACLs given')
  }

  const p = path.normalize(abs).toString()

  for (const allowed of acls) {
    if (p.startsWith(allowed)) {
      return true
    }
  }

  return false
}

module.exports = {
  isExt,
  stripExt,
  getExt,
  guessContentType,
  walkDir,
  isSafePath
}
