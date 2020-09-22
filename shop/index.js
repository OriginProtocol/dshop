require('dotenv').config()

import { spawn, exec } from 'child_process'
import fs from 'fs'

import services from '@origin/services'

async function start() {
  // Make life easier by creating a .env if one doesn't exist
  if (!fs.existsSync(`${__dirname}/.env`)) {
    fs.copyFileSync(`${__dirname}/dev.env`, `${__dirname}/.env`)
  }

  // Create a backend dist if one doesn't exist
  if (!fs.existsSync(`${__dirname}/../backend/dist/index.html`)) {
    console.log('No backend dist found. Building...')
    await new Promise((resolve, reject) => {
      exec(`npm run build:dist`, (error, stdout) => {
        if (error) reject(error)
        else resolve(stdout)
      })
    })
  }

  let shuttingDown = false

  const shutdownAll = async () => {
    if (shuttingDown) return
    shuttingDown = true

    if (shutdown) {
      await shutdown()
    }
    if (webpackDevServer) {
      webpackDevServer.kill()
    }
    if (backend) {
      backend.kill()
    }
    console.log('Shut down ok.')
  }

  process.on('SIGINT', shutdownAll)
  process.on('SIGTERM', shutdownAll)

  const shutdown = await services({
    ganache: true,
    deployContracts: true,
    ipfs: process.env.NO_IPFS !== 'true',
    skipContractsIfExists: process.env.CLEAN ? false : true
  })

  const devServerArgs = ['--host=0.0.0.0']
  if (process.env.NODE_ENV === 'production') {
    devServerArgs.push('--info=false')
  }
  if (process.env.NOOPENER !== 'true') {
    devServerArgs.push('--open')
  }
  if (process.env.WATCH === 'true') {
    devServerArgs.push('--watch')
  }

  const webpackDevServer = spawn(
    './node_modules/.bin/webpack-dev-server',
    devServerArgs,
    {
      stdio: 'inherit',
      env: process.env
    }
  )

  let backend
  if (process.env.BACKEND !== 'false') {
    const Addresses = require(`@origin/contracts/build/contracts.json`)
    const localContractAddress = Addresses.Marketplace_V01
    console.log(`Starting backend with local contract ${localContractAddress}`)

    const backendProcessName =
      process.env.USE_NODEMON === 'true' ? 'nodemon' : 'node'

    backend = spawn(backendProcessName, ['../backend'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        MARKETPLACE_CONTRACT: localContractAddress,
        DATA_URL:
          process.env.DATA_URL || `http://0.0.0.0:8081/${process.env.DATA_DIR}/`
      }
    })
  }
}

start()
