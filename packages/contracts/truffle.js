// Local setup
const truffleSetup = {
  migrations_directory: './migrations',
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    }
  },
  coverage: {
    host: 'localhost',
    network_id: '*',
    port: 8555, // <-- If you change this, also set the port option in .solcover.js.
    gas: 0xfffffffffff, // <-- Use this high gas value
    gasPrice: 0x01 // <-- Use this low gas price
  },
  solc: { optimizer: { enabled: true, runs: 200 } }
}

// These are needed to use ES2015+ syntax, such as import. The token tests
// imported from OpenZeppelin need these.
require('@babel/register')
require('@babel/polyfill')

module.exports = truffleSetup
