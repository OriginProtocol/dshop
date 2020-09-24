const fetch = require('node-fetch')
const sortBy = require('lodash/sortBy')
const get = require('lodash/get')

const { Shop } = require('../models')
const { getConfig } = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')

const { authShop } = require('./_auth')
const makeOffer = require('./_makeOffer')
const { OrderPaymentTypes } = require('../enums')

const log = getLogger('routes.uphold')

const UpholdEndpoints = {
  production: {
    api: 'https://api.uphold.com',
    auth: 'https://www.uphold.com'
  },
  sandbox: {
    api: 'https://api-sandbox.uphold.com',
    auth: 'https://sandbox.uphold.com'
  }
}

module.exports = function (router) {
  router.get('/uphold', async (req, res) => {
    req.session.upholdAccessToken = null
    req.session.upholdAuth = null
    req.session.save(function () {
      res.send(
        `<html>
        <meta http-equiv="refresh" content="1; url=/">
        <script>window.opener.postMessage('uphold:error', '*')</script>
        <body>Redirecting...</body>
      </html>`
      )
    })
  })

  router.get('/uphold/authed', authShop, async (req, res) => {
    const { upholdApi } = getConfig(req.shop.config)
    if (!UpholdEndpoints[upholdApi]) {
      return res.json({ authed: false, message: 'Uphold not configured' })
    }
    const authToken = req.session.upholdAccessToken
    if (authToken) {
      const response = await fetch(`${UpholdEndpoints[upholdApi].api}/v0/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      const json = await response.json()
      return res.json({
        success: true,
        authed: json.id ? true : false,
        name: json.fullName
      })
    }

    const shopConfig = getConfig(req.shop.config)
    const clientId = shopConfig.upholdClient
    const state = Math.floor(Math.random() * 10000000)
    req.session.upholdAuth = { shop: req.shop.id, state }
    const scopes = [
      'transactions:transfer:application',
      'transactions:transfer:others',
      'transactions:read',
      'user:read',
      'cards:read'
    ]
    const baseUri = `${UpholdEndpoints[upholdApi].auth}/authorize/${clientId}`
    res.json({
      success: true,
      authed: false,
      redirect: `${baseUri}?scope=${scopes.join(' ')}&state=${state}`
    })
  })

  router.get('/uphold/auth-response', async (req, res) => {
    const { upholdAuth } = req.session
    const { code, state } = req.query
    if (!upholdAuth) {
      log.error('No upholdAuth in session')
      res.send(
        `<script>window.opener.postMessage('uphold:error', '*')</script>Err`
      )
      return
    }

    if (state !== String(upholdAuth.state)) {
      log.error('Incorrect upholdAuth state', state, upholdAuth.state)
      res.send(
        `<script>window.opener.postMessage('uphold:error', '*')</script>Err`
      )
      return
    }

    const shop = await Shop.findOne({ where: { id: upholdAuth.shop } })
    if (!shop) {
      log.error('No shop')
      res.send(
        `<script>window.opener.postMessage('uphold:error', '*')</script>Err`
      )
      return
    }
    const shopConfig = getConfig(shop.config)
    const apiEndpoint = get(UpholdEndpoints, `[${shopConfig.upholdApi}].api`)
    if (!apiEndpoint) {
      log.error('Uphold not configured')
      res.send(
        `<script>window.opener.postMessage('uphold:error', '*')</script>Err`
      )
    }

    const response = await fetch(`${apiEndpoint}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: [
        `client_id=${shopConfig.upholdClient}`,
        `client_secret=${shopConfig.upholdSecret}`,
        'grant_type=authorization_code',
        `code=${code}`
      ].join('&')
    })

    const body = await response.json()
    if (body.access_token) {
      req.session.upholdAccessToken = body.access_token
    }

    res.send(`<script>window.opener.postMessage('uphold:ok', '*')</script>OK`)
  })

  router.get('/uphold/cards', authShop, async (req, res) => {
    const { upholdApi } = getConfig(req.shop.config)
    if (!UpholdEndpoints[upholdApi]) {
      return res.json({ success: false, message: 'Uphold not configured' })
    }
    const authToken = req.session.upholdAccessToken
    // log.debug('Token', authToken)
    if (!authToken) {
      return res.json({ success: false })
    }
    const response = await fetch(
      `${UpholdEndpoints[upholdApi].api}/v0/me/cards`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    )
    const json = await response.json()
    const cards = json.map((card) => {
      const { id, label, balance, currency, normalized } = card
      const norm = normalized.find((n) => n.currency === 'USD')
      return {
        id,
        label,
        balance,
        normalizedBalance: Number(norm.balance),
        currency
      }
    })
    const filteredCards = cards.filter((c) => c.balance !== '0.00')
    const sortedCards = sortBy(filteredCards, [(o) => -o.normalizedBalance])
    res.json({ success: true, cards: sortedCards })
  })

  // body: { amount, listingId, data }
  router.post(
    '/uphold/pay',
    authShop,
    async (req, res, next) => {
      const shopConfig = getConfig(req.shop.config)
      const upholdApi = shopConfig.upholdApi
      if (!UpholdEndpoints[upholdApi]) {
        return res.json({ success: false, message: 'Uphold not configured' })
      }

      const authToken = req.session.upholdAccessToken

      if (!authToken) {
        return res.json({ success: false, reason: 'Bad auth token' })
      }
      if (!req.body.amount) {
        return res.json({ success: false, reason: 'No amount' })
      }
      if (!req.body.data) {
        return res.json({ success: false, reason: 'No encrypted data' })
      }
      if (!req.body.card) {
        return res.json({ success: false, reason: 'No card' })
      }

      const url = `${UpholdEndpoints[upholdApi].api}/v0/me/cards/${req.body.card}`
      const body = {
        denomination: {
          amount: Number(req.body.amount) / 100,
          currency: 'USD'
        },
        destination: shopConfig.upholdClient
      }

      const response = await fetch(`${url}/transactions?commit=true`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const json = await response.json()

      if (json.errors) {
        log.debug(JSON.stringify(json, null, 2))
        return res.json({ error: 'Error' })
      }

      req.amount = req.body.amount
      req.paymentCode = json.id
      req.paymentType = OrderPaymentTypes.Uphold

      next()
    },
    makeOffer
  )

  router.post('/uphold/logout', authShop, (req, res) => {
    req.session.upholdAccessToken = null
    req.session.upholdAuth = null
    req.session.save(function () {
      res.json({ success: true })
    })
  })
}
