/* eslint-disable */

// Run printful operations on local data. Mostly useful for testing.

require('dotenv').config()
const program = require('commander')
const fs = require('fs')
const socket = require('socket.io')

const writeProductData = require('../logic/printful/sync/writeProductData')
const getSizeGuide = require('./printful/getSizeGuide')

program.requiredOption('-s, --site <site>', 'Site name')

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
}

program.parse(process.argv)

const OutputDir = `${__dirname}/../data/${program.site}`

async function start() {
  await writeProductData({ OutputDir, png: program.png })
}

start()
