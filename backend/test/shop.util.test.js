const chai = require('chai')
const expect = chai.expect

const { getShopDataUrl } = require('../utils/shop')

describe('Shop Utils', () => {
  it('should create a data URL', async () => {
    // Prod environment.
    const netConfig = {
      domain: 'ogn.app'
    }
    const shop = {
      hostname: 'foo',
      authToken: 'bar'
    }
    let dataUrl = getShopDataUrl(shop, netConfig)
    expect(dataUrl).to.be.equal('https://foo.ogn.app/bar/')

    // Dev environment.
    netConfig.domain = 'localhost'
    netConfig.backendUrl = 'http://localhost:1234'
    dataUrl = getShopDataUrl(shop, netConfig)
    expect(dataUrl).to.be.equal('http://localhost:1234/bar/')
  })
})
