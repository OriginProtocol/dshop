const { BigQuery } = require('@google-cloud/bigquery')
const util = require('ethereumjs-util')
const dayjs = require('dayjs')
const get = require('lodash/get')

const { authShop } = require('./_auth')
const { Affiliate, Order } = require('../models')
const { getConfig } = require('../utils/encryptedConfig')
const { getLogger } = require('../utils/logger')

const log = getLogger('routes.affiliate')

function authAffiliate(req, res, next) {
  try {
    const sig = util.fromRpcSig(Buffer.from(req.body.sig.slice(2), 'hex'))
    const msg = util.hashPersonalMessage(Buffer.from(req.body.msg))
    const pubKey = util.ecrecover(msg, sig.v, sig.r, sig.s)
    const addrBuf = util.pubToAddress(pubKey)
    const account = util.bufferToHex(addrBuf)
    req.affiliate = util.toChecksumAddress(account) // Note: address is normalized to its checksummed version.

    const [, date] = req.body.msg.split('OGN Affiliate Login ')
    const dateOk = dayjs(date).isAfter(dayjs().subtract(1, 'day'))
    if (!dateOk) {
      return res.json({ authed: false })
    }
  } catch (e) {
    return res.json({ authed: false })
  }
  next()
}

/**
 * Formats a BigQuery product row into a dshop product obj
 */
function bqProductFormatter(product) {
  const listingIdFromProductId = (id) => {
    const parts = id.split('-')
    parts.pop()
    return parts.join('-')
  }
  const makeId = (product) => {
    // product ID is only in the IPFS path returned
    const productId = product.ipfs_path.split('/')[2]
    // listing ID is part of the "product_id" returned by BQ
    const listingId = listingIdFromProductId(product.product_id)
    return `${listingId}-${productId}`
  }

  const id = makeId(product)
  const { price, title, image } = product

  return {
    id,
    data: `/ipfs/${product.ipfs_path}`,
    price,
    title,
    image
  }
}

/**
 * Get the products from BigQuery for a specific shop
 */
async function fetchAffiliateProducts({ listingId, credentials, table }) {
  let bq
  if (credentials) {
    bq = new BigQuery({ projectId: credentials.project_id, credentials })
  } else {
    bq = new BigQuery()
  }

  let where = `parent_external_id  = ''`

  if (listingId) {
    where += ` AND STARTS_WITH(product_id, '${listingId}')`
  }

  const grouped = `product_id, ipfs_path, title, price, image`
  const query = `SELECT MAX(block_number) as block_number, ${grouped}
    FROM ${table}
    WHERE ${where}
    GROUP BY ${grouped}
    ORDER BY block_number DESC, product_id;`

  const [job] = await bq.createQueryJob({ query })
  const [rows] = await job.getQueryResults()

  if (!rows) return []

  const seen = new Set()

  return rows
    .filter((row) => {
      if (seen.has(row.ipfs_path)) {
        return false
      }
      seen.add(row.ipfs_path)
      return true
    })
    .slice(0, 50)
    .map((row) => bqProductFormatter(row))
}

module.exports = function (router) {
  /**
   * Creates or updates an affiliate account.
   */
  router.post(
    '/affiliate/join',
    authShop,
    authAffiliate,
    async (req, res, next) => {
      try {
        const account = req.affiliate
        const firstName = get(req, 'body.firstName', '').trim()
        const lastName = get(req, 'body.lastName', '').trim()
        const email = get(req, 'body.email', '').trim()

        // Validate the email.
        const emailRegex = /^[a-z0-9-._+]+@[a-z0-9-]+(\.[a-z]+)*(\.[a-z]{2,})$/i
        if (!emailRegex.test(email)) {
          return res.json({
            success: false,
            reason: `Invalid email address ${email}`
          })
        }

        // Validate first/last name.
        if (!firstName) {
          return res.json({ success: false, reason: 'First name is empty' })
        }
        if (!lastName) {
          return res.json({ success: false, reason: 'Last name is empty' })
        }

        // Lookup the account to see if it already exists.
        const a = await Affiliate.findOne({ where: { account } })
        if (a) {
          // This is an update.
          log.info(`Updating affiliate account ${account}`)
          if (
            a.firstName !== firstName ||
            a.lastName !== lastName ||
            a.email !== email
          ) {
            await a.update({ firstName, lastName, email })
          }
        } else {
          // New affiliate. Create a new row.
          log.info(`Creating new affiliate account ${account}`)
          await Affiliate.create({ account, firstName, lastName, email })
        }
        res.json({ success: true })
      } catch (err) {
        next(err) // Pass the error to the top error handler.
      }
    }
  )

  router.post('/affiliate/login', authShop, authAffiliate, async (req, res) => {
    res.json({ authed: true, account: req.affiliate })
  })

  router.post(
    '/affiliate/earnings',
    authShop,
    authAffiliate,
    async (req, res) => {
      const orders = await Order.findAll({
        where: { shopId: req.shop.id, referrer: req.affiliate, archived: false }
      })

      const results = {
        pendingOrders: 0,
        completedOrders: 0,
        commissionPending: 0,
        commissionPaid: 0
      }

      orders.forEach((order) => {
        if (order.statusStr === 'OfferFinalized') {
          results.completedOrders += 1
        } else {
          results.pendingOrders += 1
        }
        results.commissionPending += order.commissionPending
        results.commissionPaid += order.commissionPaid
      })

      res.send(results)
    }
  )

  router.get('/affiliate/products', authShop, async (req, res) => {
    const shopConfig = getConfig(req.shop.config)
    // const listingId = req.shop ? req.shop.dataValues.listingId : null

    let credentials
    try {
      credentials = JSON.parse(shopConfig.bigQueryCredentials)
    } catch (e) {
      log.warn('No BigQuery credentials found in shop config')
    }

    const table = shopConfig.bigQueryTable || process.env.BIG_QUERY_TABLE
    if (!table) {
      log.warn('No BigQuery table configured')
      return res.json([])
    }

    const products = await fetchAffiliateProducts({ credentials, table })
    res.json(products)
  })
}
