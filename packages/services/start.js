const program = require('commander')
const start = require('./index.js')

program
  .option('-g, --ganache', 'Start Ganache')
  .option('-i, --ipfs', 'Start IPFS')
  .option(
    '-d, --deploy-contracts',
    'Deploy contracts and update addresses in relevant configs'
  )
  .option('-x, --ssl-proxy', 'Start SSL proxy')
  .option('-q, --quiet', 'Quiet')
  .parse(process.argv)

async function setup() {
  const stop = await start({
    ganache: true,
    deployContracts: true,
    ipfs: true,
    populate: true,
    writeTruffle: true
  })
  stop()
}

if (!process.argv.slice(2).length) {
  program.outputHelp()
  process.exit(1)
} else if (program.setup) {
  setup()
} else {
  start({
    ganache: program.ganache,
    ipfs: program.ipfs,
    deployContracts: program.deployContracts,
    sslProxy: program.sslProxy,
    quiet: program.quiet
  })
}
