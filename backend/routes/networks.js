const { authSuperUser } = require('./_auth')
const { Network } = require('../models')
const { getConfig, setConfig } = require('../utils/encryptedConfig')
const startListener = require('../listener')
const omit = require('lodash/omit')
const pick = require('lodash/pick')

function pickConfig(body) {
  return pick(body, [
    'pinataKey',
    'pinataSecret',
    'ipfsClusterUser',
    'ipfsClusterPassword',
    'cloudflareEmail',
    'cloudflareApiKey',
    'domain',
    'deployDir',
    'discordWebhook',
    'gcpCredentials',
    'defaultShopConfig',
    'web3Pk',
    'backendUrl',
    'fallbackShopConfig',
    'googleAnalytics',
    'paypalEnvironment',
    'notificationEmail',
    'notificationEmailDisplayName',
    'uiCdn',
    'awsAccessKeyId',
    'awsSecretAccessKey',
    'listingId'
  ])
}

module.exports = function (router) {
  /**
   * Creates a new network. Called during the deployer's initial setup.
   */
  router.post('/networks', authSuperUser, async (req, res) => {
    const networkObj = {
      networkId: req.body.networkId,
      provider: req.body.provider,
      providerWs: req.body.providerWs,
      ipfs: req.body.ipfs,
      ipfsApi: req.body.ipfsApi,
      marketplaceContract: req.body.marketplaceContract,
      marketplaceVersion: req.body.marketplaceVersion,
      listingId: req.body.listingId,
      publicSignups: req.body.publicSignups ? true : false,
      // By default we disable the use of the marketplace.
      // TODO: expose via a flag in the UI.
      useMarketplace: false,
      active: req.body.active ? true : false,
      config: setConfig(pickConfig(req.body))
    }

    const existing = await Network.findOne({
      where: { networkId: networkObj.networkId }
    })
    if (existing) {
      await Network.update(networkObj, {
        where: { networkId: networkObj.networkId }
      })
    } else {
      await Network.create(networkObj)
    }

    startListener()

    res.json({ success: true })
  })

  /**
   * Updates an existing network. Called from the super-admin console.
   */
  router.get('/networks/:netId', authSuperUser, async (req, res) => {
    const where = { networkId: req.params.netId }
    const network = await Network.findOne({ where })
    if (!network) {
      return res.json({ success: false, reason: 'no-network' })
    }

    const config = getConfig(network.config)
    res.json({ ...omit(network.dataValues, 'config'), ...config })
  })

  router.put('/networks/:netId', authSuperUser, async (req, res) => {
    const where = { networkId: req.params.netId }
    const network = await Network.findOne({ where })
    if (!network) {
      return res.json({ success: false, reason: 'no-network' })
    }

    const config = pickConfig(req.body)
    const result = await Network.update(
      {
        config: setConfig(config, network.dataValues.config),
        ipfs: req.body.ipfs,
        ipfsApi: req.body.ipfsApi,
        listingId: req.body.listingId,
        publicSignups: req.body.publicSignups ? true : false
      },
      { where }
    )

    if (!result || result[0] < 1) {
      return res.json({ success: false })
    }

    res.json({ success: true })
  })

  router.post(
    '/networks/:netId/make-active',
    authSuperUser,
    async (req, res) => {
      const where = { networkId: req.params.netId }
      const network = await Network.findOne({ where })
      if (!network) {
        return res.json({ success: false, reason: 'no-network' })
      }

      await Network.update({ active: false }, { where: {} })
      const result = await Network.update({ active: true }, { where })

      if (!result || result[0] < 1) {
        return res.json({ success: false })
      }

      res.json({ success: true })
    }
  )
}
