/**
 * This file should be run before all other tests, which can be done by passing
 * the --file option to mocha. It sets up and tears down the infrastructure
 * (ethereum test node and IPFS) required to run tests.
 */
const fs = require('fs')
const { exec, execFile } = require('child_process')
const services = require('@origin/services')

const { apiRequest } = require('./utils')

const {
  BACKEND_PORT,
  TEST_TMP_DIR,
  TEST_DATABASE_URL,
  TEST_DSHOP_CACHE,
  TEST_NETWORK_ID,
  USER_EMAIL_1,
  USER_PASS_1
} = require('./const')

const isWatchMode = process.argv.some(
  (arg) => arg === '-w' || arg === '--watch'
)
let shutdownServices

function sequelizeMigrate() {
  return new Promise((resolve, reject) => {
    const migrate = exec(
      'sequelize db:migrate --config db/config.js --migrations-path db/migrations',
      { env: process.env },
      (err) => (err ? reject(err) : resolve())
    )

    // Forward stdout+stderr to this process
    migrate.stdout.pipe(process.stdout)
    migrate.stderr.pipe(process.stderr)
  })
}

before(async function () {
  this.timeout(30000)

  // Create a temp directory for sqlite, shop cache, etc...
  console.log(`Using test temp dir at ${TEST_TMP_DIR}`)
  fs.mkdirSync(TEST_TMP_DIR)
  fs.mkdirSync(TEST_DSHOP_CACHE)

  // Run migrations and start the API server.
  process.env.PORT = BACKEND_PORT
  process.env.DATABASE_URL = TEST_DATABASE_URL
  await sequelizeMigrate()
  require('../app')

  // Unless instructed to use already running services, start services and deploy contracts.
  if (!process.env.USE_RUNNING_SERVICES) {
    shutdownServices = await services({
      ganache: { inMemory: true, total_accounts: 6 },
      deployContracts: true,
      ipfs: true
    })
  }

  // Create a super-admin user, log it in and activate the 999 network.
  let body = {
    name: 'Test user',
    email: USER_EMAIL_1,
    password: USER_PASS_1,
    superuser: true
  }
  let response = await apiRequest({
    method: 'POST',
    endpoint: '/auth/registration',
    body
  })
  if (!response.success) {
    throw new Error('Failed registering a super-admin user')
  }

  body = {
    email: USER_EMAIL_1,
    password: USER_PASS_1
  }
  response = await apiRequest({
    method: 'POST',
    endpoint: '/superuser/login',
    body
  })
  if (!response.success) {
    throw new Error('Failed logging in the super-admin user')
  }

  response = await apiRequest({
    method: 'POST',
    endpoint: `/networks/${TEST_NETWORK_ID}/make-active`
  })
  if (!response.success) {
    throw new Error('Failed activating network 999')
  }
})

// Override exit code to prevent error when using Ctrl-c after `npm run test:watch`
if (isWatchMode) {
  process.once('exit', () => process.exit(0))
} else {
  // Shutdown services and clean up if we're not in watch mode and tests are finished.
  after(async function () {
    if (shutdownServices) {
      await shutdownServices()
    }
    if (TEST_TMP_DIR.startsWith('/tmp') && !process.env.LEAVE_TEST_TMP_DIR) {
      console.log(`Cleaning up test data in ${TEST_TMP_DIR}...`)
      // Note: fs.rmdirSync(TEST_TMP_DIR, { recursive: true }) is still experimental and does not seem to work.
      await new Promise((resolve, reject) => {
        execFile('rm', ['-rf', TEST_TMP_DIR], (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    }
  })
}
