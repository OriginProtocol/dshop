const fs = require('fs')
const crypto = require('crypto')
const dotenv = require('dotenv')
const { promisify } = require('bluebird')
const { ENCRYPTION_KEY } = require('./const')
const { Shop } = require('../models')

const readFileAsync = promisify(fs.readFile)

if (typeof ENCRYPTION_KEY === 'undefined') {
  throw new TypeError('ENCRYPTION_KEY undefined')
}

const ENCRYPTION_KEY_HASH = crypto
  .createHash('sha256')
  .update(ENCRYPTION_KEY)
  .digest()
const CYPHER_ALGO = 'aes256'
const IV_LENGTH = 16

const loadedConfigs = {}
const loadedIVs = {}

function genIV() {
  return crypto.randomBytes(IV_LENGTH)
}

function decryptConfig(config) {
  if (!config) return {}
  const [iv, configRaw] = config.split(':')
  return decryptJSON(Buffer.from(iv, 'hex'), configRaw)
}
// TODO: Depreciate in favor of more informative name
const getConfig = decryptConfig

function encryptConfig(newConfig, existingConfig) {
  let iv = genIV()
  if (existingConfig) {
    iv = Buffer.from(existingConfig.split(':')[0], 'hex')
  }
  const config = encryptJSON(iv, newConfig)
  return `${iv.toString('hex')}:${config}`
}
// TODO: Depreciate in favor of more informative name
const setConfig = encryptConfig

/**
 * Get already loaded initialization vector or create one
 *
 * @param {number} shopId
 * @returns {Buffer}
 */
function getIV(shopId) {
  let iv
  if (typeof loadedIVs[shopId] === 'undefined') {
    iv = crypto.randomBytes(IV_LENGTH)
  }
  // only shop it if we've been given an ID
  if (shopId) loadedIVs[shopId] = iv
  return iv
}

/**
 * Encrypt a string using the provided iv and system wide encryption key
 *
 * @param {Buffer} iv - initialization vector to use with encryption
 * @param {string} str - string to encrypt
 * @returns {string} - encrypted data
 */
function encrypt(iv, str) {
  const msg = []

  const cypher = crypto.createCipheriv(CYPHER_ALGO, ENCRYPTION_KEY_HASH, iv)

  msg.push(cypher.update(str, 'utf8', 'hex'))
  msg.push(cypher.final('hex'))

  return msg.join('')
}

/**
 * Encrypt a JS object using the provided iv and system wide encryption key
 *
 * @param {Buffer} iv - initialization vector to use with encryption
 * @param {string} obj - js object to encrypt
 * @returns {string} - encrypted data
 */
function encryptJSON(iv, obj) {
  return encrypt(iv, JSON.stringify(obj))
}

/**
 * Decrypt a string using the provided iv and system wide encryption key
 *
 * @param {Buffer} iv - initialization vector to use with encryption
 * @param {string} enc - encrypted string to decrypt
 * @returns {string} - decrypted data
 */
function decrypt(iv, enc) {
  const msg = []

  const decypher = crypto.createDecipheriv('aes256', ENCRYPTION_KEY_HASH, iv)

  msg.push(decypher.update(enc, 'hex', 'utf8'))
  msg.push(decypher.final('utf8'))

  return msg.join('')
}

/**
 * Decrypt a JS object using the provided iv and system wide encryption key
 *
 * @param {Buffer} iv - initialization vector to use with encryption
 * @param {string} enc - encrypted string to decrypt into an object
 * @returns {string} - decrypted object
 */
function decryptJSON(iv, enc) {
  return JSON.parse(decrypt(iv, enc))
}

/**
 * Create a Shops record in the DB with provided name and config
 *
 * @param {string} name - shop name
 * @param {Object} configObj - config object to shop
 * @returns {Object} - Shops model instance
 */
async function create(name, configObj) {
  const iv = getIV()
  const encryptedConf = encryptJSON(iv, configObj)
  const record = await Shop.create({
    name,
    config: [iv, encryptedConf].join(':')
  })
  if (!record.id) throw new Error('Shop does not have an id, something failed!')

  const shopId = record.id
  loadedConfigs[shopId] = configObj
  loadedIVs[shopId] = iv

  return record
}

/**
 * Create config on a Shops record in the DB with provided config
 *
 * @param {number} shopId - shop ID
 * @param {Object} configObj - config object to shop
 * @returns {Object} - Shops model instance
 */
async function createConfig(shopId, configObj) {
  const iv = getIV()
  const encryptedConf = encryptJSON(iv, configObj)
  const record = await Shop.update(
    {
      config: [iv, encryptedConf].join(':')
    },
    {
      where: {
        id: shopId
      }
    }
  )

  if (!record || record[0] === 0) {
    throw new Error('Shop does not have an id, something failed!')
  }

  loadedConfigs[shopId] = configObj
  loadedIVs[shopId] = iv

  return record
}

/**
 * Clear the cache for a shop
 *
 * @param {number} shopId - shop ID
 * @returns {boolean} - If it succeeded
 */
function clear(shopId) {
  if (typeof loadedConfigs[shopId] === 'undefined') {
    return false
  }
  return delete loadedConfigs[shopId] && delete loadedIVs[shopId]
}

/**
 * Save a Shop record in the DB
 *
 * @param {number} shopId - shop ID
 * @returns {Object} - Shop model instance
 */
async function save(shopId) {
  const record = await Shop.findOne({ where: { id: shopId } })
  if (!record) throw new Error('Shop does not exist')

  // Skip if we don't have any config
  if (typeof loadedConfigs[shopId] === 'undefined') return record
  if (typeof loadedIVs[shopId] === 'undefined')
    throw new Error('Missing initialization vector?')

  record.config = [
    loadedIVs[shopId].toString('hex'),
    encryptJSON(loadedIVs[shopId], loadedConfigs[shopId])
  ].join(':')

  await record.save({ fields: ['config'] })

  return record
}

/**
 * Load a Shop record from the DB
 *
 * @param {number} shopId - shop ID
 * @param {boolean} force - bypass cache if there's a cached Shop
 * @returns {Object} - Shop model instance
 */
async function load(shopId, force = false) {
  const record = await Shop.findOne({ where: { id: shopId } })
  if (!force && typeof loadedConfigs[shopId] !== 'undefined') return record
  if (!record.config) {
    await createConfig(shopId, {})
    return null
  }

  const [iv, encryptedConf] = record.config.split(':')
  loadedIVs[shopId] = Buffer.from(iv, 'hex')

  loadedConfigs[shopId] = decryptJSON(loadedIVs[shopId], encryptedConf)

  return record
}

/**
 * Load and save a Shops config from a dotenv configuration
 *
 * @param {number} shopId - shop ID
 * @param {string} filename - full path to dotenv file
 * @returns {Object} - Shops model instance
 */
async function loadFromEnv(shopId, filename) {
  const rawConfig = dotenv.parse(await readFileAsync(filename))

  if (!loadedConfigs[shopId]) {
    loadedConfigs[shopId] = {}
  }

  for (const k in rawConfig) {
    // TODO: toLowerCase right here?
    loadedConfigs[shopId][k.toLowerCase()] = rawConfig[k]
  }

  return await save(shopId)
}

/**
 * Create a Shops record and config from a dotenv configuration
 *
 * @param {number} shopId - shop ID
 * @param {string} filename - full path to dotenv file
 * @returns {Object} - Shop model instance
 */
async function createFromEnv(shopName, filename) {
  const rawConfig = dotenv.parse(await readFileAsync(filename))
  const config = {}

  for (const k in rawConfig) {
    // TODO: toLowerCase right here?
    config[k.toLowerCase()] = rawConfig[k]
  }

  const record = await create(shopName, config)

  loadedConfigs[record.id] = config

  return record
}

/**
 * Set a config value for a shop
 *
 * @param {number} shopId - shop ID
 * @param {string} key - configuration key
 * @param {T} val - value to set the config key to
 * @param {boolean} autosave - whether or not to persist the config
 */
async function set(shopId, key, val, autosave = true) {
  await load(shopId)
  loadedConfigs[shopId][key] = val
  if (autosave) await save(shopId)
}

/**
 * Set many config keys with an object
 *
 * @param {number} shopId - shop ID
 * @param {object} conf - configuration object
 * @param {boolean} autosave - whether or not to persist the config
 */
async function assign(shopId, conf, autosave = true) {
  await load(shopId)
  loadedConfigs[shopId] = {
    ...loadedConfigs[shopId],
    ...conf
  }
  if (autosave) await save(shopId)
}

/**
 * Get a config value for a shop
 *
 * @param {number} shopId - shop ID
 * @param {string} key - configuration key
 * @returns {T} value set to the configuration key
 */
async function get(shopId, key) {
  await load(shopId)
  return loadedConfigs[shopId][key]
}

/**
 * Dump an entire config for a shop
 *
 * @param {number} shopId - shop ID
 * @returns {Object} shop config
 */
async function dump(shopId) {
  await load(shopId)
  return loadedConfigs[shopId]
}

module.exports = {
  IV_LENGTH,
  encrypt,
  encryptJSON,
  decrypt,
  decryptJSON,
  clear,
  save,
  load,
  loadFromEnv,
  createFromEnv,
  createConfig,
  set,
  assign,
  get,
  dump,
  getConfig,
  encryptConfig,
  setConfig,
  decryptConfig
}
