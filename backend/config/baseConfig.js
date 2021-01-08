const shopConfig = {
  title: '',
  fullTitle: '',
  byline: '',
  logo: '',
  css: '',
  backendAuthToken: '',
  favicon: 'favicon.png',

  supportEmail: 'Store <store@ogn.app>',
  twitter: '',
  medium: '',
  facebook: '',

  stripe: false,
  beta: false,
  discountCodes: false,

  pgpPublicKey: '',

  networks: {
    1: {
      marketplaceContract: '0x698ff47b84837d3971118a369c570172ee7e54c2',
      marketplaceEpoch: 8582597,
      affiliate: '',
      arbitrator: '',
      backend: 'https://dshop.originprotocol.comp',
      ipfsGateway: 'https://fs-autossl.ogn.app',
      ipfsApi: 'https://fs.ogn.app'
    },
    4: {
      marketplaceContract: '0x3d608cce08819351ada81fc1550841ebc10686fd',
      marketplaceEpoch: 5119455,
      backend: 'https://rinkebyapi.ogn.app',
      ipfsGateway: 'https://fs-autossl.staging.ogn.app',
      ipfsApi: 'https://fs.staging.ogn.app'
    },
    999: {
      marketplaceEpoch: 0,
      listingId: '999-001-1',
      backend: 'http://0.0.0.0:3000',
      ipfsGateway: 'http://localhost:8080',
      ipfsApi: `http://localhost:${process.env.IPFS_API_PORT || 5002}`
    }
  }
}

const shipping = [
  {
    id: 'international',
    label: 'Free Shipping',
    detail: 'Arrives in 10 to 14 days',
    amount: 0
  }
]

module.exports = {
  shopConfig,
  shipping
}
