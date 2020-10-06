const { Network } = require('../models')
const { createListing } = require('../utils/createListing')
const contractsJSON = require('../../packages/contracts/build/contracts.json')

const pk = '0xAE6AE8E5CCBFB04590405997EE2D52D2B330726137B875053C36D94E974D162F'

async function go() {
  const network = await Network.findOne({ where: { networkId: '999' } })
  if (!network.marketplaceContract) {
    network.marketplaceContract = contractsJSON.Marketplace_V01
  }
  const listingId = await createListing({
    network,
    pk,
    listing: { title: 'Test Shop' }
  })
  console.log(`Created listing ${listingId}`)
}

go()
