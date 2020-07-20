require('dotenv').config()

// DB config for migrations only.
// The config used by the app is under src/models/index.js

const sqlite = `sqlite:${__dirname}/dshop.db`
const url = process.env.DATABASE_URL || sqlite

module.exports = {
  development: { url, logging: false, define: { underscored: true } },
  test: { url, logging: false, define: { underscored: true } },
  production: { url, logging: false, define: { underscored: true } }
}
