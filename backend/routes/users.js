const { Network, Seller, Shop, SellerShop } = require('../models')
const {
  authSuperUser,
  authSellerAndShop,
  createSalt,
  hashPassword
} = require('./_auth')
const { createSeller } = require('../utils/sellers')
const pick = require('lodash/pick')
const omit = require('lodash/omit')
const { Op } = require('sequelize')

const { sendVerificationEmail } = require('../utils/sellers')
const { verifyEmailCode } = require('../utils/emailVerification')

const { getLogger } = require('../utils/logger')

const log = getLogger('routes.users')

module.exports = function (router) {
  router.get('/superuser/users', authSuperUser, async (req, res) => {
    Seller.findAll().then((users) => {
      res.json({ users })
    })
  })

  router.get('/superuser/users/:userId', authSuperUser, async (req, res) => {
    Seller.findOne({
      where: { id: req.params.userId },
      include: Shop
    }).then((user) => {
      SellerShop.findAll({
        where: { sellerId: user.id },
        include: { model: Shop, as: 'shop', attributes: ['authToken', 'name'] }
      }).then((shops) => {
        res.json({
          user,
          shops: shops.map((s) => s.toJSON()).filter((s) => s.shop)
        })
      })
    })
  })

  router.put('/superuser/users/:userId', authSuperUser, async (req, res) => {
    const user = await Seller.findOne({ where: { id: req.params.userId } })
    if (!user) {
      return res.json({ success: false, reason: 'no-such-user' })
    }
    const email = req.body.email.toLowerCase()
    const userWithEmail = await Seller.findOne({
      where: { [Op.not]: [{ id: req.params.userId }], email }
    })
    if (userWithEmail) {
      return res.json({
        success: false,
        field: 'email',
        reason: 'Email exists'
      })
    }

    const fields = pick(req.body, 'name', 'email', 'superuser')
    const passwordPlain = req.body.password
    if (passwordPlain) {
      const salt = await createSalt()
      fields.password = await hashPassword(salt, passwordPlain)
    }

    await Seller.update(fields, { where: { id: req.params.userId } })
    res.json({ success: true })
  })

  router.post('/superuser/users', authSuperUser, async (req, res) => {
    createSeller(req.body, {
      superuser: req.body.superuser,
      skipEmailVerification: true
    }).then((result) => {
      res.json(result)
    })
  })

  router.post('/register', async (req, res) => {
    const network = await Network.findOne({ where: { active: true } })
    if (!network || !network.publicSignups) {
      res.json({ success: false, message: 'Public signups disabled' })
      return
    }

    const fields = pick(req.body, 'name', 'email', 'password')
    const { seller, status, error } = await createSeller(fields)

    if (error) {
      return res.status(status).json({ success: false, message: error })
    }

    if (!seller) {
      return res.json({ success: false })
    }

    req.session.sellerId = seller.id
    res.json({ success: true })
  })

  router.delete('/superuser/users/:userId', authSuperUser, async (req, res) => {
    const { userId } = req.params
    if (String(userId) === String(req.session.sellerId)) {
      return res.json({ success: false, reason: 'cannot-delete-self' })
    }

    const user = await Seller.findOne({ where: { id: req.params.userId } })
    if (!user) {
      return res.json({ success: false, reason: 'no-such-user' })
    }

    SellerShop.destroy({ where: { sellerId: userId } })
      .then(() => Seller.destroy({ where: { id: userId } }))
      .then(() => res.json({ success: true }))
      .catch((err) => res.json({ success: false, reason: err.toString() }))
  })

  router.get('/verify-email', async (req, res) => {
    const { code } = req.query
    const seller = await Seller.findOne({
      where: {
        data: {
          emailVerificationCode: code
        }
      }
    })

    const resp = verifyEmailCode(code, seller)

    if (resp.success) {
      await seller.update({
        emailVerified: true,
        data: omit(seller.data, [
          'emailVerificationCode',
          'verificationExpiresAt',
          'verificationRedirectTo'
        ])
      })

      return res.redirect(`${resp.redirectTo}/#/admin/settings/users`)
    }

    res.send(resp)
  })

  router.put('/resend-email', authSellerAndShop, async (req, res) => {
    let sent = false

    try {
      sent = await sendVerificationEmail(req.seller, req.shop.id)
    } catch (err) {
      log.error('Could not resend verification email', err)
    }

    return res.send({
      success: sent
    })
  })
}
