/**
 * This file should be run before all other tests, which can be done by passing
 * the --file option to mocha. It sets up and tears down the infrastructure
 * (ethereum test node and IPFS) required to run tests.
 */
const fs = require('fs')
const { exec } = require('child_process')
const services = require('@origin/services')

const {
  BACKEND_PORT,
  TMP_DIR,
  TEST_DATABASE_URL,
  TEST_DSHOP_CACHE
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
  // Start backend
  fs.mkdirSync(TMP_DIR)
  process.env.PORT = BACKEND_PORT
  process.env.DATABASE_URL = TEST_DATABASE_URL
  process.env.DSHOP_CACHE = TEST_DSHOP_CACHE
  await sequelizeMigrate()
  require('../app')

  // Start Ganache (in-memory) and IPFS
  shutdownServices = await services({
    ganache: { inMemory: true, total_accounts: 6 },
    ipfs: true
  })
})

// Override exit code to prevent error when using Ctrl-c after `npm run test:watch`
if (isWatchMode) {
  process.once('exit', () => process.exit(0))
} else {
  // Shutdown ganache etc if we're not in watch mode and tests are finished.
  after(async function () {
    await shutdownServices()
  })
}
