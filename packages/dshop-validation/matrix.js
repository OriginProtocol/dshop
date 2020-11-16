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
 * @param id {string} - ID of an element to return
 * @returns {object} - service element from a matrix
 */
function getElement(id) {
  const matrix = getMatrix()
  return find(matrix, (e) => e.id === id && e.supported)
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
        if (e.supported && isConfigured(networkConfig, e.id)) {
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
  return uniq(matrix.filter((e) => selection.includes(e.id)).map((e) => e.type))
}

/**
 * Check if a given element is properly configured
 *
 * @param networkConfig {object} - Decrypted network configuration
 * @param element {object} - Service element from a service matrix
 * @returns {boolean} - if given element is configured
 */
function elementIsConfigured(networkConfig, element) {
  return every(element.requiresConfig.map((k) => !!networkConfig[k]))
}

/**
 * Check if a service is properly configured by id
 *
 * @param selection {Array<string>} - Array of resource matrix IDs
 * @returns {boolean} - if the service element appears to be configured
 */
function isConfigured(networkConfig, id) {
  const element = getElement(id)
  if (!element) return false
  return elementIsConfigured(networkConfig, element)
}

/**
 * Figure out which dependencies are missing for which services
 *
 * @param selection {Array<string>} - Array of resource matrix IDs
 * @returns {boolean} - if all required deps are in selection
 */
function hasRequiredDependencies(selection) {
  for (const id of selection) {
    const el = getElement(id)
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
 * @param selection {Array<string>} - Array of resource matrix IDs
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
 * @param selection {Array<string>} - Array of resource matrix IDs
 * @returns {boolean} - if all required deps are in selection
 */
function canUseResource({ networkConfig, selection, id }) {
  if (!selection.includes(id)) return false
  const ids = getAvailableResources({ networkConfig })
  return ids.includes(id)
}

/**
 * Figure out which dependencies are missing for which services
 *
 * @param selection {Array<string>} - Array of resource matrix IDs
 * @returns {Array<string>} - error strings
 */
function dependencyErrors(selection) {
  const errors = []
  for (const id of selection) {
    const el = getElement(id)
    if (!el.depends) continue
    for (const dep of el.depends) {
      if (!selection.includes(dep)) {
        const depEl = getElement(dep)
        errors.push(`${el.name} requires ${depEl.name}`)
      }
    }
  }
  return errors
}

/**
 * Returns infra resources that are configured and available for use
 *
 * @returns {Array<string|object>} - array of resource IDs or resource objects
 */
function getAvailableResources({ networkConfig, fullObjects = false }) {
  const matrix = getMatrix()

  if (fullObjects) {
    return matrix.filter((r) => isConfigured(networkConfig, r.id))
  }

  const ids = matrix.map((x) => x.id)
  return ids.filter((k) => isConfigured(networkConfig, k))
}

/**
 * Returns infra resources that are configured and available for use
 *
 * @returns {Array<string>} - array of resource IDs
 */
function getSupportedResources() {
  const matrix = getMatrix()
  return matrix.filter((r) => r.supported)
}

/**
 * Validate that a given selection of infra resources are configured and ready
 * to go.  It will check that needed dependencies are selected and that the
 * necessary configuration is ready to go.
 *
 * @param args {object}
 * @param args.networkConfig {object} - Decrypted network configuration
 * @param args.selection {Array<string>} - Array of resource matrix IDs
 * @returns {boolean} - if everything validates correction
 */
function validateSelection({ networkConfig, selection }) {
  const errors = []
  const matrix = getMatrix()
  const ids = matrix.map((x) => x.id)

  // Validate IDs given
  if (!every(selection, (s) => ids.includes(s))) {
    const invalidKeys = selection.filter((s) => !ids.includes(s))
    errors.push(`Invalid selection ID(s): ${invalidKeys.join(', ')}`)

    // No need to continue validating invalid IDs
    selection = selection.filter((k) => !invalidKeys.includes(k))
  }

  // Validate selection dependencies
  if (!hasRequiredDependencies(selection)) {
    const depErrors = dependencyErrors(selection)
    depErrors.forEach((de) => errors.push(de))
  }

  // Validate configuration
  for (const id of selection) {
    if (!isConfigured(networkConfig, id)) {
      errors.push(`${id} is not configured`)
    }
  }

  return {
    success: errors.length < 1,
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
  getSupportedResources,
  validateSelection
}
