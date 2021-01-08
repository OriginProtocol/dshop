const chai = require('chai')
const expect = chai.expect

const { getOrCreateTestNetwork } = require('./utils')
const { getText, get, post, getIpfsHashFromBytes32 } = require('../utils/_ipfs')

const IPFS_TEST_TIMEOUT = 500 // 500msec

describe('IPFS Utils', () => {
  let network, data1, data1Hash, data2, data2Hash

  before(async () => {
    network = await getOrCreateTestNetwork()
    data1 = { name: 'data1' }
    data2 = { name: 'data2' }
  })

  it('should post', async () => {
    data1Hash = await post(network.ipfsApi, data1, true)
    const data2HashBytes = await post(network.ipfsApi, data2, false)
    data2Hash = getIpfsHashFromBytes32(data2HashBytes)

    expect(data1Hash).to.be.a('string')
    expect(data2Hash).to.be.a('string')
    expect(data2HashBytes).to.startsWith('0x')
  })

  it('should getText', async () => {
    const data1Text = await getText(network.ipfs, data1Hash, IPFS_TEST_TIMEOUT)

    expect(data1Text).to.be.equal(JSON.stringify(data1))
  })

  it('should get', async () => {
    const data2Json = await get(network.ipfs, data2Hash, IPFS_TEST_TIMEOUT)

    expect(data2Json).to.be.a('object')
    expect(data2Json.name).to.be.equal('data2')
  })

  // Known issue: this test fails if run multiples times.
  // As a workaround, clear the IPTS service data before running it.
  // TODO(franck): dynamically generate random data and figure the
  //  associated hash in order to make this test idempotent.
  it('should throw a timeout error and succeed on 2nd try (NOTE: expected to fail if IPFS service was not cleared)', async () => {
    const data3 = { name: 'data3' }
    const expectedData3Hash = 'Qmd78po6SFVtys6yP42M2crED7UjRKKydt5D1tkxnVQZg8'

    // Request a non-existent yet piece of content - we expect a timeout.
    let failure = false
    try {
      await get(network.ipfs, expectedData3Hash, IPFS_TEST_TIMEOUT)
    } catch (e) {
      failure = true
    }
    expect(failure).to.be.true

    // Upload the content
    const data3Hash = await post(network.ipfsApi, data3, true)
    expect(data3Hash).to.be.equal(expectedData3Hash)

    // Request the content again. This time it should work.
    const data3Json = await get(network.ipfs, data3Hash, IPFS_TEST_TIMEOUT)
    expect(data3Json).to.be.a('object')
    expect(data3Json.name).to.be.equal('data3')
  })
})
