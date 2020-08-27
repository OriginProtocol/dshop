const fetch = require('node-fetch')
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

const { getLogger } = require('../utils/logger')
const log = getLogger('routes.auth')

const AUTH_FAILURE_MESSAGE = 'Authentication failed'
const AUTH_FAILURE_RESPOSNE = {
  success: false,
  message: AUTH_FAILURE_MESSAGE
}

/**
 * Utility function. Gets the secure random password automatically generated
 * during the GCP marketplace deployment of the instance.
 * See https://cloud.google.com/marketplace/docs/partners/vm/build-vm-image#creating_authorization_credentials
 * @private
 */
async function getGcpSuperAdminPassword() {
  const url =
    'http://metadata/computeMetadata/v1/instance/attributes/DSHOP_SUPERADMIN_PASSWORD'
  const res = await fetch(url, {
    headers: { 'Metadata-Flavor': 'Google' },
    method: 'GET'
  })
  if (!res.ok) {
    log.error(`GET ${url} returned ${res}`)
    throw new Error(`Failed fetching GCP super-admin credentials.`)
  }
  const password = await res.text()
  return password
}

/**
 * Gets the EC2 instance ID
 */
async function getEC2InstanceID() {
  const url = 'http://169.254.169.254/latest/meta-data/instance-id'
  const res = await fetch(url)
  if (!res.ok) {
    log.error(`GET ${url} returned ${res}`)
    throw new Error(`Failed fetching EC2 instance ID.`)
  }
  const password = await res.text()
  return password
}

module.exports = function (router) {
  router.get('/auth', async (req, res) => {
    const userCount = await Seller.count()
    if (!userCount) {
      return res.json({ success: false, reason: 'no-users', setup: true })
    }

    const allNetworks = await Network.findAll()
    const activeNet = allNetworks.find((n) => n.active)
    const activeNetConfig = activeNet ? encConf.getConfig(activeNet.config) : {}
    const backendUrl = get(activeNetConfig, 'backendUrl')
    const publicSignups = get(activeNet, 'publicSignups', false)

    if (!req.session.sellerId) {
      return res.json({
        success: false,
        reason: 'not-logged-in',
        backendUrl,
        publicSignups
      })
    }

    if (!activeNet) {
      return res.json({
        success: false,
        reason: 'no-active-network',
        setup: true
      })
    }

    const user = await Seller.findOne({ where: { id: req.session.sellerId } })
    if (!user) {
      return res.json({
        success: false,
        reason: 'no-such-user',
        backendUrl,
        publicSignups
      })
    }
    const { email, emailVerified, name } = user

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
          'active',
          'domain',
          'backendUrl',
          'publicSignups',
          'googleAnalytics'
        ])
      }
    })
    const network = networks.find((n) => n.active)

    const shopDataDir = DSHOP_CACHE

    const include = { model: Seller, where: { id: user.id } }

    const shopsCount = await Shop.count(
      user.superuser ? undefined : { include }
    )

    let shopAuthed = false,
      role
    if (req.query.active) {
      const shopExists = await Shop.findOne({
        include: user.superuser ? undefined : include,
        where: { authToken: req.query.active }
      })
      if (shopExists) {
        shopAuthed = true
        role = get(shopExists, 'Sellers[0].SellerShop.dataValues.role')
      }
    }

    let localShops
    if (user.superuser && fs.existsSync(shopDataDir)) {
      localShops = fs
        .readdirSync(shopDataDir)
        .filter((shop) =>
          fs.existsSync(`${shopDataDir}/${shop}/data/config.json`)
        )
    }

    if (user.superuser && !shopsCount) {
      return res.json({
        success: false,
        reason: 'no-shops',
        backendUrl,
        networks,
        network,
        email,
        name,
        localShops
      })
    }

    const response = {
      success: true,
      shopAuthed,
      shopsCount,
      email,
      name,
      networks,
      network,
      backendUrl,
      localShops,
      emailVerified,
      role: user.superuser ? 'admin' : role
    }
    if (user.superuser) {
      response.superuser = true
    }

    res.json(response)
  })

  router.get('/auth/:email', async (req, res) => {
    // TODO: Add some rate limiting here
    const { email } = req.params
    const seller = await Seller.findOne({ where: { email } })
    return res.sendStatus(seller === null ? 404 : 204)
  })

  router.post('/superuser/login', async (req, res) => {
    const email = get(req.body, 'email', '').toLowerCase()
    const seller = await Seller.findOne({ where: { email, superuser: true } })
    if (!seller) {
      log.debug('Login failed: no such user')
      return res.send(AUTH_FAILURE_RESPOSNE)
    }
    const check = await checkPassword(req.body.password, seller.password)
    if (check === true) {
      req.session.sellerId = seller.id
      res.json({ success: true, email: seller.email, role: 'superuser' })
    } else {
      log.debug('Login failed: invalid password')
      res.json(AUTH_FAILURE_RESPOSNE)
    }
  })

  router.post('/auth/login', async (req, res) => {
    const seller = await Seller.findOne({ where: { email: req.body.email } })
    if (!seller) {
      log.debug('Login failed: no such user')
      return res.send(AUTH_FAILURE_RESPOSNE)
    }
    const check = await checkPassword(req.body.password, seller.password)
    if (check === true) {
      req.session.sellerId = seller.id
      req.seller = seller
    } else {
      log.debug('Login failed: invalid password')
      return res.send(AUTH_FAILURE_RESPOSNE)
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

  router.post('/auth/logout', logoutHandler)

  /**
   * Creates a super admin account.
   * Called during initial onboarding flow for standing up the system.
   */
  router.post('/auth/registration', async (req, res) => {
    const sellerCount = await numSellers()
    if (sellerCount > 0) {
      log.warn(
        `Super admin reg attempt when ${sellerCount} sellers already exist!`
      )
      return res.status(409).json({
        success: false,
        message: 'An initial user has already been setup'
      })
    }

    if (process.env.GCP_MARKETPLACE_DEPLOYMENT) {
      // In the case of a GCP marketplace deployment, the super-admin password is auto-generated
      // when the VM gets launched. It is then displayed to the operator on the deployment page
      // of the GCP console. We enforce the use of that password to prevent a malicious actor from
      // creating a super-admin account before the operator.
      let gcpPassword
      try {
        gcpPassword = await getGcpSuperAdminPassword()
      } catch (e) {
        return res.status(500).json({
          success: false,
          message:
            'An error occurred while fetching super-admin credentials. Please contact support.'
        })
      }
      if (req.body.password !== gcpPassword) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid password. Please use the super-admin password displayed on the GCP console.'
        })
      }
    }

    if (process.env.AWS_MARKETPLACE_DEPLOYMENT) {
      /**
       * In the case of a AWS marketplace deployment, the super-admin password
       * is the EC2 instance ID.
       */
      let password
      try {
        password = await getEC2InstanceID()
      } catch (e) {
        return res.status(500).json({
          success: false,
          message:
            'An error occurred while fetching super-admin credentials. Please contact support.'
        })
      }
      if (req.body.password !== password) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid password. Please use the EC2 instance ID as the password.'
        })
      }
    }

    const { seller, status, error } = await createSeller(req.body, {
      superuser: true,
      // TODO: Explore some ways to send email before a superadmin account is created?
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

  router.delete('/auth/registration', async (req, res) => {
    const { sellerId } = req.session

    if (!sellerId) {
      return res.status(400).json({ success: false })
    }

    const destroy = await Seller.destroy({ where: { id: sellerId } })

    req.logout()
    res.json({ success: false, destroy })
  })

  router.get(
    '/config',
    authSellerAndShop,
    authRole('admin'),
    async (req, res) => {
      const config = encConf.getConfig(req.shop.config)
      return res.json({
        success: true,
        config: {
          ...config,
          ...pick(req.shop.dataValues, [
            'hostname',
            'hasChanges',
            'listingId',
            'walletAddress'
          ])
        }
      })
    }
  )

  router.get('/password', authShop, async (req, res) => {
    const password = await encConf.get(req.shop.id, 'password')
    if (!password) {
      return res.json({ success: true })
    } else if (req.session.authedShop === req.shop.id) {
      return res.json({ success: true })
    }
    res.json({ success: false })
  })

  router.post('/password', authShop, async (req, res) => {
    const password = await encConf.get(req.shop.id, 'password')
    if (req.body.password === password) {
      req.session.authedShop = req.shop.id
      return res.json({ success: true })
    }
    res.json({ success: false })
  })
}
