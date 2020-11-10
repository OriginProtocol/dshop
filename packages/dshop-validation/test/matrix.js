const chai = require('chai')
const expect = chai.expect

const {
  setMatrix,
  getAvailableResources,
  validateSelection
} = require('../matrix')

const testMatrix1 = require('./fixtures/matrix1.json')

describe('Infra matrix config', () => {
  it('should return available resources', async () => {
    // We need to use our test matrix instead of the default one
    setMatrix(testMatrix1)

    // This will act as our decrypted network configuration
    const networkConfig = {
      filecoinPrivkey: 'asdf1234',
      heheUser: 'hehe',
      hehePassword: 'trustno1',
      rcdnKey: 'wxyz',
      rcdnSecret: '9876',
      smtpHost: 'localhost',
      smtpUser: 'smtp',
      smtpPassword: 'passw0rd'
    }

    // Using the above config, it should return resources that are properly
    // configured and ready for use
    const resources = getAvailableResources({ networkConfig })

    expect(resources).to.be.an('array')
    expect(resources).to.have.lengthOf(4)
    expect(resources).to.not.include('imaginary-cdn')
    expect(resources).to.include('filecoin-files')
    expect(resources).to.include('he-dns')
    expect(resources).to.include('real-cdn')
    expect(resources).to.include('smtp-email')
  })

  it('validate valid configuration', async () => {
    // We need to use our test matrix instead of the default one
    setMatrix(testMatrix1)

    // This will act as our decrypted network configuration
    const networkConfig = {
      filecoinPrivkey: 'asdf1234',
      heheUser: 'hehe',
      hehePassword: 'trustno1',
      rcdnKey: 'wxyz',
      rcdnSecret: '9876',
      smtpHost: 'localhost',
      smtpUser: 'smtp',
      smtpPassword: 'passw0rd'
    }

    // These are the selected infra services we want to use
    const selection = ['filecoin-files', 'he-dns', 'real-cdn', 'smtp-email']

    const validation = validateSelection({ networkConfig, selection })

    expect(validation.success).to.be.true
    expect(validation.errors).to.have.lengthOf(0)
  })

  it('validate invalid configuration missing config', async () => {
    // We need to use our test matrix instead of the default one
    setMatrix(testMatrix1)

    // This will act as our decrypted network configuration
    const networkConfig = {
      filecoinPrivkey: 'asdf1234',
      heheUser: 'hehe',
      hehePassword: 'trustno1',
      rcdnKey: 'wxyz',
      rcdnSecret: '9876',
      smtpHost: 'localhost',
      smtpUser: 'smtp'
    }

    // These are the selected infra services we want to use
    const selection = ['filecoin-files', 'he-dns', 'real-cdn', 'smtp-email']

    const validation = validateSelection({ networkConfig, selection })

    expect(validation.success).to.be.false
    expect(validation.errors).to.have.lengthOf(1)
    expect(validation.errors[0]).to.be.a('string')
    expect(validation.errors[0]).to.include('smtp-email')
  })

  it('validate invalid selection', async () => {
    // We need to use our test matrix instead of the default one
    setMatrix(testMatrix1)

    // This will act as our decrypted network configuration
    const networkConfig = {
      filecoinPrivkey: 'asdf1234',
      heheUser: 'hehe',
      hehePassword: 'trustno1',
      rcdnKey: 'wxyz',
      rcdnSecret: '9876',
      smtpHost: 'localhost',
      smtpUser: 'smtp',
      smtpPassword: 'passw0rd'
    }

    // These are the selected infra services we want to use
    const selection = ['filecoin-files', 'he-dns', 'real-cdn', 'invalid-email']

    const validation = validateSelection({ networkConfig, selection })

    expect(validation.success).to.be.false
    expect(validation.errors).to.have.lengthOf(1)
    expect(validation.errors[0]).to.be.a('string')
    expect(validation.errors[0]).to.include('invalid-email')
  })

  it('validate missing dependency', async () => {
    // We need to use our test matrix instead of the default one
    setMatrix(testMatrix1)

    // This will act as our decrypted network configuration
    const networkConfig = {
      filecoinPrivkey: 'asdf1234',
      heheUser: 'hehe',
      hehePassword: 'trustno1',
      rcdnKey: 'wxyz',
      rcdnSecret: '9876',
      smtpHost: 'localhost',
      smtpUser: 'smtp',
      smtpPassword: 'passw0rd'
    }

    // These are the selected infra services we want to use
    const selection = ['filecoin-files', 'real-cdn']

    const validation = validateSelection({ networkConfig, selection })

    expect(validation.success).to.be.false
    expect(validation.errors).to.have.lengthOf(1)
    expect(validation.errors[0]).to.be.a('string')
    expect(validation.errors[0]).to.include('Hurricane')
  })
})
