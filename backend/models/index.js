require('dotenv').config()

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const basename = path.basename(__filename)
const db = {}

let URI
if (process.env.NODE_ENV === 'test') {
  // In test environment, always use SQLite with storage in a tmp directory.
  const { TEST_TMP_DIR } = require('../test/const')
  URI = `sqlite:${TEST_TMP_DIR}/dshop.db`
} else {
  // In non-test environments, fallback to SQLite if DATABASE_URL is not defined.
  const sqliteURI = `sqlite:${__dirname}/../db/dshop.db`
  URI = process.env.DATABASE_URL || sqliteURI
}

const sequelize = new Sequelize(URI, {
  logging: false,
  underscored: true,
  timestamps: false
})

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
