require('dotenv').config()

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
const basename = path.basename(__filename)

const env = process.env.NODE_ENV || 'development'
const config = require(`../db/config.js`)[env]

const db = {}

const sequelize = new Sequelize(config.url, config)

const isJs = (file) =>
  file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'

fs.readdirSync(__dirname)
  .filter(isJs)
  .forEach((file) => {
    const model = sequelize['import'](path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize
db.Op = Sequelize.Op

module.exports = db
