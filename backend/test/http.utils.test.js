const chai = require('chai')
const expect = chai.expect

const { getHTTPS } = require('../utils/http')

const { TEST_DOMAIN_1, BAD_DOMAIN_1 } = require('./const')

describe('HTTP Utils', () => {
  it('should make a successful HTTPS GET request to a known domain', async () => {
    expect(await getHTTPS(`https://www.${TEST_DOMAIN_1}`)).to.be.undefined
  })

  it('should fail at making an HTTPS GET request to a non-existant domain', async () => {
    return getHTTPS(`https://www.${BAD_DOMAIN_1}`).catch((err) =>
      expect(err)
        .to.be.an('error')
        .with.property('message')
        .that.has.string('ENOTFOUND')
    )
  })

  // TODO: Remove this
  it('should sleep for 3 seconds', async () => {
    const start = +new Date()
    await (async () => {
      return new Promise((resolve) => setTimeout(resolve, 3000))
    })()
    const end = +new Date()
    expect(end - start).to.be.above(2999)
  })
})
