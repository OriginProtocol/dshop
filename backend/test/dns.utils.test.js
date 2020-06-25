const chai = require('chai')
const expect = chai.expect

const {
  isPublicDNSName,
  isUnsoppableName,
  isCryptoName
} = require('../utils/dns')

const { TEST_DOMAIN_1, TEST_UNSTOPPABLE_DOMAIN_1 } = require('./const')

describe('DNS Utils', () => {
  it('should recognize an Unstoppable domain', async () => {
    expect(isUnsoppableName(TEST_UNSTOPPABLE_DOMAIN_1)).to.be.true
  })

  it('should recognize crypto domains', async () => {
    expect(isCryptoName(TEST_UNSTOPPABLE_DOMAIN_1)).to.be.true
  })

  it('should recognize non-crypto domains', async () => {
    expect(isPublicDNSName(TEST_DOMAIN_1)).to.be.true
  })
})
