/**
 * This module handles infra configuration so different services can be used on
 * different IaaS providers.  It handles checking dependencies and configuration
 * to make sure everything should work.
 *
 *                | Files  | DNS | CDN | E-mail |
 *     -----------+--------+-----+-----+--------+
 *     Cloudflare | u      | s   | s   | n      |
 *     AWS        | s      | s   | s   | s      |
 *     GCP        | s      | s   | s   | n      |
 *     SendGrid   | n      | n   | n   | s      |
 *     Pinata     | s      | n   | n   | n      |
 *     IPFS Clust | s      | n   | n   | n      |
 *     -----------+--------+-----+-----+--------|
 *
 *     u = unsupported
 *     s = supported
 *     n = not applicable
 */
const { uniq, every, find } = require('lodash')

const defaultSpec = require('./resourceMatrix.json')

let spec = null

/**
 * Get matrix
 *
 * @return matrix {object} - Service matrix for this singleton
 */
function getMatrix() {
  if (!spec) {
    spec = defaultSpec
  }

  return spec
}

/**
 * Set the matrix this singleton uses for validation
 *
 * @param matrix {object} - Service matrix this singleton should use for
 *    validation
 */
function setMatrix(matrix) {
  if (matrix) {
    spec = matrix
  } else {
    spec = defaultSpec
  }
}

/**
 * Check if a given element is properly configured
 *
 * @param key {string} - Name of an element to return
 * @returns {object} - service element from a matrix
 */
function getElement(key) {
  const matrix = getMatrix()
  return find(matrix, (e) => e.name === key && e.supported)
}

/**
 * Return all supported and ready to use types
 *
 * @returns {Array<string>} string resource types
 */
function getSupportedTypes(networkConfig) {
  const matrix = getMatrix()
  return uniq(
    matrix
      .filter((e) => {
        if (e.supported && isConfigured({ networkConfig, key: e.name })) {
          return e
        }
      })
      .map((e) => e.type)
  )
}

/**
 * Return all types in given resource selection
 *
 * @returns {Array<string>} string resource types
 */
function getSelectedTypes(selection) {
  const matrix = getMatrix()
  return uniq(
    matrix.filter((e) => selection.includes(e.name)).map((e) => e.type)
  )
}

/**
 * Check if a given element is properly configured
 *
 * @param networkConfig {object} - Decrypted network configuration
 * @param element {object} - Service element from a service matrix
 * @returns {boolean} - if given element is configured
 */
function elementIsConfigured(networkConfig, element) {
  return every(element.requiresConfig.map((k) => k in networkConfig))
}

/**
 * Check if a service is properly configured by name
 *
 * @param selection {Array<string>} - Array of resource matrix keys
 * @returns {boolean} - if the service element appears to be configured
 */
function isConfigured(networkConfig, key) {
  const element = getElement(key)
  if (!element) return false
  return elementIsConfigured(networkConfig, element)
}

/**
 * Figure out which dependencies are missing for which services
 *
 * @param selection {Array<string>} - Array of resource matrix keys
 * @returns {boolean} - if all required deps are in selection
 */
function hasRequiredDependencies(selection) {
  for (const key of selection) {
    const el = getElement(key)
    if (!el.depends) continue
    if (!every(el.depends, (dep) => selection.includes(dep))) {
      return false
    }
  }
  return true
}

/**
 * Check if there's a supported resource of type selected and configured
 *
 * @param selection {Array<string>} - Array of resource matrix keys
 * @returns {boolean} - if all required deps are in selection
 */
function canUseResourceType({ networkConfig, selection, type }) {
  const types = getSupportedTypes(networkConfig)
  const selectedTypes = getSelectedTypes(selection)
  return types.includes(type) && selectedTypes.includes(type)
}

/**
 * Check if there's a supported resource selected and configured
 *
 * @param selection {Array<string>} - Array of resource matrix keys
 * @returns {boolean} - if all required deps are in selection
 */
function canUseResource({ networkConfig, selection, key }) {
  if (!selection.includes(key)) return false
  const keys = getAvailableResources({ networkConfig })
  return keys.includes(key)
}

/**
 * Figure out which dependencies are missing for which services
 *
 * @param selection {Array<string>} - Array of resource matrix keys
 * @returns {Array<string>} - error strings
 */
function dependencyErrors(selection) {
  const errors = []
  for (const key of selection) {
    const el = getElement(key)
    if (!el.depends) continue
    for (const dep of el.depends) {
      if (!selection.includes(dep)) {
        errors.push(`${el.name} requires ${dep}`)
      }
    }
  }
  return errors
}

/**
 * Returns infra resources that are configured and available for use
 *
 * @returns {Array<string>} - array of resource keys
 */
function getAvailableResources({ networkConfig }) {
  const matrix = getMatrix()
  const keys = matrix.map((x) => x.name)
  return keys.filter((k) => isConfigured(networkConfig, k))
}

/**
 * Validate that a given selection of infra resources are configured and ready
 * to go.  It will check that needed dependencies are selected and that the
 * necessary configuration is ready to go.
 *
 * @param args {object}
 * @param args.networkConfig {object} - Decrypted network configuration
 * @param args.selection {Array<string>} - Array of resource matrix keys
 * @returns {boolean} - if everything validates correction
 */
function validateSelection({ networkConfig, selection }) {
  const errors = []
  const matrix = getMatrix()
  const keys = matrix.map((x) => x.name)

  // Validate keys given
  if (!every(selection, (s) => keys.includes(s))) {
    const invalidKeys = selection.filter((s) => !keys.includes(s))
    errors.push(`Invalid selection key(s): ${invalidKeys.join(', ')}`)

    // No need to continue validating invalid keys
    selection = selection.filter((k) => !invalidKeys.includes(k))
  }

  // Validate selection dependencies
  if (!hasRequiredDependencies(selection)) {
    const depErrors = dependencyErrors(selection)
    depErrors.forEach((de) => errors.push(de))
  }

  // Validate configuration
  for (const key of selection) {
    if (!isConfigured(networkConfig, key)) {
      errors.push(`${key} is not configured`)
    }
  }

  return {
    success: errors.length > 0,
    errors
  }
}

module.exports = {
  getMatrix,
  setMatrix,
  isConfigured,
  canUseResource,
  canUseResourceType,
  getAvailableResources,
  validateSelection
}
