const crypto = require('crypto')
const chai = require('chai')
const expect = chai.expect

const { IV_LENGTH, encrypt, decrypt } = require('../utils/encryptedConfig')

describe('Encrypted config', () => {
  it('should encrypt and decrypt ASCII', async () => {
    const original = 'My name is job.'
    const iv = crypto.randomBytes(IV_LENGTH)
    const enc = encrypt(iv, original)
    const dec = decrypt(iv, enc)

    expect(dec).to.be.equal(original)
  })

  it('should encrypt and decrypt UTF-8', async () => {
    const original = '街角杂货铺'
    const iv = crypto.randomBytes(IV_LENGTH)
    const enc = encrypt(iv, original)
    const dec = decrypt(iv, enc)

    expect(dec).to.be.equal(original)
  })

  it('should encrypt and decrypt UTF-8 with control', async () => {
    const original = 'Something ♥️'
    const iv = crypto.randomBytes(IV_LENGTH)
    const enc = encrypt(iv, original)
    const dec = decrypt(iv, enc)

    expect(dec).to.be.equal(original)
  })
})
