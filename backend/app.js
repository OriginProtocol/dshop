const fs = require('fs')
const _escape = require('lodash/escape')
const express = require('express')
const session = require('express-session')
const Router = require('express-promise-router')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const cors = require('cors')
const bodyParser = require('body-parser')
const serveStatic = require('serve-static')
const set = require('lodash/set')
const kebabCase = require('lodash/kebabCase')

const { getConfig } = require('./utils/encryptedConfig')
const { sequelize, Network } = require('./models')
const hostCache = require('./utils/hostCache')
const { getLogger } = require('./utils/logger')
const { IS_PROD, DSHOP_CACHE } = require('./utils/const')
const { Sentry, sentryEventPrefix } = require('./sentry')
const { scheduleDNSVerificationJob } = require('./queues/dnsStatusProcessor')

const log = getLogger('app')

if (typeof process.env.DISABLE_QUEUE_PROCESSSORS === 'undefined') {
  require('./queues').runProcessors()
}
scheduleDNSVerificationJob()

const ORIGIN_WHITELIST_ENABLED = false
const ORIGIN_WHITELIST = []
const BODYPARSER_EXCLUDES = [
  '/webhook',
  '/products/upload-images',
  '/themes/upload-images'
]

const app = express()

// TODO: Restrict this more? See: https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', true)

// Must be the first middleware.
app.use(Sentry.Handlers.requestHandler())

app.use(
  cors({
    origin: (origin, cb) => {
      if (ORIGIN_WHITELIST_ENABLED && !ORIGIN_WHITELIST.includes(origin)) {
        cb(new Error('Not allowed by CORS'))
      }
      // if (!origin) log.debug('No Origin header provided')
      cb(null, origin || '*')
    },
    credentials: true
  })
)

// Configure sessions.
const sessionStore = new SequelizeStore({ db: sequelize })
app.use(
  session({
    secret: 'keyboard cat', // TODO
    resave: true,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD
    },
    store: sessionStore
  })
)

// Custom middleware to exclude some specific endpoints from the JSON bodyParser
const jsonBodyParser = bodyParser.json()
app.use((req, res, next) => {
  if (BODYPARSER_EXCLUDES.includes(req.originalUrl)) return next()
  return jsonBodyParser(req, res, next)
})

app.use(serveStatic(`${__dirname}/dist`, { index: false }))
app.use('/theme', serveStatic(`${__dirname}/themes`, { index: false }))

// Use express-promise-router which allows middleware to return promises.
const router = Router()
app.use(router)

require('./routes/networks')(router)
require('./routes/auth')(router)
require('./routes/users')(router)
require('./routes/shops')(router)
require('./routes/affiliate')(router)
require('./routes/uphold')(router)
require('./routes/orders')(router)
require('./routes/printful')(router)
require('./routes/stripe')(router)
require('./routes/discounts')(router)
require('./routes/tx')(router)
require('./queues/ui')(router)
require('./routes/products')(router)
require('./routes/collections')(router)
require('./routes/domains')(router)
require('./routes/shipping-zones')(router)
require('./routes/health')(router)
require('./routes/offline-payment')(router)
require('./routes/paypal')(router)
require('./routes/exchange-rates')(router)
require('./routes/crypto')(router)
require('./routes/themes')(router)

async function getNetworkName() {
  const network = await Network.findOne({ where: { active: true } })
  return !network
    ? 'NETWORK'
    : network.networkId === 1
    ? 'mainnet'
    : network.networkId === 4
    ? 'rinkeby'
    : 'localhost'
}

router.get('/', async (req, res) => {
  let html
  const authToken = await hostCache(req.hostname)

  if (authToken) {
    try {
      html = fs
        .readFileSync(`${DSHOP_CACHE}/${authToken}/public/index.html`)
        .toString()
    } catch (e) {
      return res.status(404).send('')
    }
  } else {
    try {
      html = fs.readFileSync(`${__dirname}/dist/index.html`).toString()
    } catch (e) {
      return res.send('')
    }

    const NETWORK = await getNetworkName()
    html = html
      .replace('DATA_DIR', '')
      .replace('TITLE', 'Origin Dshop')
      .replace(/NETWORK/g, NETWORK)
  }
  res.send(html)
})

router.get('/theme/:theme', async (req, res) => {
  const theme = req.params.theme
  if (theme !== kebabCase(theme)) {
    return res.send('Invalid theme')
  }

  const themeIndex = `${__dirname}/themes/${theme}/index.html`

  let html
  try {
    html = fs.readFileSync(themeIndex).toString()
  } catch (e) {
    return res.send('')
  }

  const slug = _escape(req.query.shop)

  const NETWORK = await getNetworkName()
  html = html
    .replace('DATA_DIR', `/${slug}`)
    .replace('TITLE', 'Origin Dshop')
    .replace(/NETWORK/g, NETWORK)
    .replace('ENABLE_LIVE_PREVIEW', 'TRUE')

  res.send(html)
})

router.get('*', async (req, res, next) => {
  const authToken = await hostCache(req.hostname)
  const split = req.path.split('/')

  if (!authToken && split.length <= 2) {
    return next()
  }

  /**
   * We're making some decisions on what source we're serving from here.
   *
   * 1) If the authToken was included in the URL, it's a data dir access.
   * 2) If it's a known deployed hostname, we want to serve the assembled shop.
   * 3) If all else failed, it's the admin
   */
  const partInUrl = decodeURIComponent(split[1])
  const dataDir = authToken ? authToken : decodeURIComponent(split[1])
  const isNamedDataAccess =
    partInUrl === authToken || (!!partInUrl && !authToken)
  const dir = `${DSHOP_CACHE}/${dataDir}${
    isNamedDataAccess ? '/data' : '/public'
  }`
  req.url = isNamedDataAccess ? split.slice(2).join('/') : req.path

  // When serving config.json from backend, override active network settings.
  // This prevents problems when, eg, the backend specified in config.json does
  // not match the backend being served from.
  try {
    if (req.url === 'config.json') {
      const network = await Network.findOne({ where: { active: true } })
      const netConfig = getConfig(network.config)
      const configRaw = fs.readFileSync(`${dir}/${req.url}`).toString()
      const config = JSON.parse(configRaw)
      const netId = network.networkId
      set(config, `networks[${netId}].ipfsGateway`, network.ipfs)
      set(config, `networks[${netId}].ipfsApi`, network.ipfsApi)
      set(config, `networks[${netId}].backend`, netConfig.backendUrl)
      return res.json(config)
    }
  } catch (err) {
    log.error(err)
  }

  serveStatic(dir)(req, res, next)
})

// Must come after controllers and before any other error middleware.
app.use(Sentry.Handlers.errorHandler())

// The custom error handler must be defined last.
// Note that it does need 4 args signature otherwise it does not get invoked.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  log.error(err)
  const sentryUrl = `${sentryEventPrefix}/${res.sentry}`
  log.error('Sentry URL:', sentryUrl)
  let error
  if (IS_PROD) {
    // Send back a generic error message on prod.
    error = {
      name: 'Unexpected error',
      message:
        'An unexpected error occurred. Our team has been notified. Please try again later.',
      sentryUrl
    }
  } else {
    // Development environment. Send back error details from the exception.
    error = {
      name: err.name,
      message: err.message,
      sentryUrl
    }
  }
  return res.status(err.status || 500).json({ error })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  log.info(`\nListening on port ${PORT}\n`)
})
