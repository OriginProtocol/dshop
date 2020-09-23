const OriginToken = artifacts.require('./token/OriginToken.sol')
const V01_Marketplace = artifacts.require('./marketplace/V01_Marketplace.sol')
const MockOUSD = artifacts.require('./token/MockOUSD.sol')

module.exports = function(deployer, network) {
  return deployer.then(() => {
    return deployContracts(deployer, network)
  })
}

async function deployContracts(deployer, network) {
  const IS_DEV = network === 'development'

  // Initial supply of 1B tokens, in natural units.
  await deployer.deploy(OriginToken, '1000000000000000000000000000')

  await deployer.deploy(V01_Marketplace, OriginToken.address)

  if (IS_DEV) {
    await deployer.deploy(MockOUSD, "OriginDollar", "OUSD", "18", "1000000000000000000000000000")
  }

  //register the marketplace as a possible caller upon token approval
  const token = await OriginToken.deployed()
  const contractOwner = await token.owner()
  await token.addCallSpenderWhitelist(V01_Marketplace.address, {from: contractOwner})

  if (IS_DEV) {
    await MockOUSD.deployed()
  }

}
