const { get } = require('./_api')
const fs = require('fs')
const sortBy = require('lodash/sortBy')

const limit = 100
async function go(apiKey) {
  let done,
    offset = 0,
    orders = []
  do {
    console.log(`Fetching from offset ${offset}`)
    const res = await get(`/orders?limit=${limit}&offset=${offset}`, { apiKey })
    orders = [...orders, ...res.result]
    offset += limit
    done = res.paging.total <= offset
  } while (!done)
  fs.writeFileSync(`${__dirname}/out.json`, JSON.stringify(orders, null, 2))
}

if (process.env.API_KEY) {
  go(process.env.API_KEY)
} else {
  const orders = JSON.parse(fs.readFileSync(`${__dirname}/out.json`).toString())

  const ids = sortBy(
    orders
      .map((o) => o.external_id)
      .filter((i) => i)
      .map((o) => Number(o.split('-')[3]))
  )

  for (let i = 0; i < ids.length; i++) {
    if (i > 0 && ids[i - 1] !== ids[i] - 1) {
      console.log(ids[i - 1], ids[i])
    }
  }
}
