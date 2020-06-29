const fs = require('fs')
const get = require('lodash/get')
const omit = require('lodash/omit')
const pick = require('lodash/pick')

const { Seller, Shop, Network } = require('../models')
const {
  checkPassword,
  authShop,
  authSellerAndShop,
  authRole
} = require('./_auth')
const { createSeller, numSellers } = require('../utils/sellers')
const encConf = require('../utils/encryptedConfig')
const { DSHOP_CACHE } = require('../utils/const')

module.exports = function (app) {
  app.get('/auth', async (req, res) => {
    const userCount = await Seller.count()
    if (!userCount) {
      return res.json({ success: false, reason: 'no-users', setup: true })
    }

    if (!req.session.sellerId) {
      return res.json({ success: false, reason: 'not-logged-in' })
    }
    const user = await Seller.findOne({ where: { id: req.session.sellerId } })
    if (!user) {
      return res.json({ success: false, reason: 'no-such-user' })
    }
    const { email, emailVerified } = user

    const allNetworks = await Network.findAll()
    const networks = allNetworks.map((n) => {
      const net = { ...encConf.getConfig(n.config), ...n.dataValues }
      if (user.superuser) {
        return omit(net, ['config'])
      } else {
        return pick(net, [
          'networkId',
          'ipfs',
          'ipfsApi',
          'marketplaceContract',
          'marketplaceVersion',
          'active'
        ])
      }
    })
    const network = networks.find((n) => n.active)
    if (!network) {
      return res.json({
        success: false,
        reason: 'no-active-network',
        setup: true
      })
    }

    const shopDataDir = DSHOP_CACHE

    const order = [['createdAt', 'desc']]
    const attributes = [
      'id',
      'name',
      'authToken',
      'hostname',
      'listingId',
      'createdAt',
      'networkId'
    ]
    const include = { model: Seller, where: { id: user.id } }

    let shops = []
    if (user.superuser) {
      const allShops = await Shop.findAll({ order })
      shops = allShops.map((s) => ({
        ...pick(s.dataValues, attributes),
        role: 'admin'
      }))
    } else {
      const allShops = await Shop.findAll({ attributes, include, order })
      shops = allShops.map((s) => ({
        ...pick(s.dataValues, attributes),
        role: get(s, 'Sellers[0].SellerShop.dataValues.role')
      }))
    }
    shops = shops.map((s) => {
      const configPath = `${shopDataDir}/${s.authToken}/data/config.json`
      const viewable = fs.existsSync(configPath)
      return { ...s, viewable }
    })

    let localShops
    if (user.superuser && fs.existsSync(shopDataDir)) {
      localShops = fs
        .readdirSync(shopDataDir)
        .filter((shop) =>
          fs.existsSync(`${shopDataDir}/${shop}/data/config.json`)
        )
        .filter((dir) => !shops.some((s) => s.authToken === dir))
    }

    if (!shops.length) {
      return res.json({
        success: false,
        reason: 'no-shops',
        networks,
        network,
        email,
        localShops
      })
    }

    const response = {
      success: true,
      email,
      networks,
      network,
      shops,
      localShops,
      emailVerified: emailVerified
    }
    if (user.superuser) {
      response.role = 'admin'
      response.superuser = true
    }

    res.json(response)
  })

  app.get('/auth/:email', async (req, res) => {
    // TODO: Add some rate limiting here
    const { email } = req.params
    const seller = await Seller.findOne({ where: { email } })
    return res.sendStatus(seller === null ? 404 : 204)
  })

  app.post('/superuser/login', async (req, res) => {
    const email = get(req.body, 'email', '').toLowerCase()
    const seller = await Seller.findOne({ where: { email, superuser: true } })
    if (!seller) {
      return res.status(404).send({ success: false, reason: 'no-such-user' })
    }
    const check = await checkPassword(req.body.password, seller.password)
    if (check === true) {
      req.session.sellerId = seller.id
      res.json({ success: true, email: seller.email, role: 'superuser' })
    } else {
      res.json({ success: false, reason: 'incorrect-pass' })
    }
  })

  app.post('/auth/login', async (req, res) => {
    const seller = await Seller.findOne({ where: { email: req.body.email } })
    if (!seller) {
      return res.status(404).send({
        success: false,
        message: 'Invalid email'
      })
    }
    const check = await checkPassword(req.body.password, seller.password)
    if (check === true) {
      req.session.sellerId = seller.id
      req.seller = seller
    } else {
      return res.status(404).send({
        success: false,
        message: 'Invalid password'
      })
    }
    res.json({
      success: true,
      email: req.seller.email,
      role: seller.superuser ? 'admin' : ''
    })
  })

  const logoutHandler = (req, res) => {
    req.session.destroy(function () {
      res.json({ success: true })
    })
  }

  app.post('/auth/logout', logoutHandler)

  app.post('/auth/registration', async (req, res) => {
    if ((await numSellers()) > 0) {
      return res.status(409).json({
        success: false,
        message: 'An initial user has already been setup'
      })
    }

    const { seller, status, error } = await createSeller(req.body, {
      superuser: true,
      // TODO: Explore some ways to send email before a shop is setup?
      skipEmailVerification: true
    })

    if (error) {
      return res.status(status).json({ success: false, message: error })
    }

    if (!seller) {
      return res.json({ success: false })
    }

    req.session.sellerId = seller.id
    res.json({ success: true })
  })

  app.delete('/auth/registration', async (req, res) => {
    const { sellerId } = req.session

    if (!sellerId) {
      return res.status(400).json({ success: false })
    }

    const destroy = await Seller.destroy({ where: { id: sellerId } })

    req.logout()
    res.json({ success: false, destroy })
  })

  app.get('/config', authSellerAndShop, authRole('admin'), async (req, res) => {
    const config = encConf.getConfig(req.shop.config)
    return res.json({
      success: true,
      config: {
        ...config,
        ...pick(req.shop.dataValues, 'hostname')
      }
    })
  })

  app.get('/password', authShop, async (req, res) => {
    const password = await encConf.get(req.shop.id, 'password')
    if (!password) {
      return res.json({ success: true })
    } else if (req.session.authedShop === req.shop.id) {
      return res.json({ success: true })
    }
    res.json({ success: false })
  })

  app.post('/password', authShop, async (req, res) => {
    const password = await encConf.get(req.shop.id, 'password')
    if (req.body.password === password) {
      req.session.authedShop = req.shop.id
      return res.json({ success: true })
    }
    res.json({ success: false })
  })
}
