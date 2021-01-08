/**
 * This script takes a list of IPFS hashes to stdin, one hash per line, and pins
 * the hash to Pinata.
 *
 * Usage
 * =====
 * $ export PINATA_API_KEY="asdf"
 * $ export PINATA_API_SECRET="123"
 * $ ipfs pin ls | awk '{ print $1 }' | node pinata_pin_hashes.js
 */
const readline = require('readline')
const fetch = require('node-fetch')
const isIPFS = require('is-ipfs')

const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_API_SECRET = process.env.PINATA_API_SECRET
const PAGE_LIMIT = 50

async function sleep(timeout = 1000) {
  return new Promise(resolve => {
    setTimeout(
      () => { resolve() },
      timeout
    )
  })
}

async function pinFetch(
  offset = 0,
  limit = PAGE_LIMIT,
  apiKey = PINATA_API_KEY,
  secretKey = PINATA_API_SECRET
) {
  const url = `https://api.pinata.cloud/data/pinList?pageLimit=${limit}&pageOffset=${offset}`
  const res = await fetch(url, {
    headers: {
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secretKey
    }
  })

  return await res.json()
}

async function pinHash(
  hashToPin,
  apiKey = PINATA_API_KEY,
  secretKey = PINATA_API_SECRET
) {
  const url = `https://api.pinata.cloud/pinning/pinByHash`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      hashToPin,
      pinataMetadata: {
        name: 'Order'
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secretKey
    }
  })

  return await res.json()
}

async function getAllPins(
  apiKey = PINATA_API_KEY,
  secretKey = PINATA_API_SECRET
) {
  const pins = []
  let total = -1
  let page = 0

  for (;;) {
    const offset = page === 0 ? 0 : page * PAGE_LIMIT
    const res = await pinFetch(offset, PAGE_LIMIT, apiKey, secretKey)

    if (total == -1) {
      total = res.count
      if (!total) break
    }

    res.rows.forEach(i => pins.push(i))

    if (offset > total) break
    page += 1
  }

  return pins
}

async function main(term) {
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.log('PINATA_API_KEY and PINATA_API_SECRET need to be defined')
    process.exit(1)
  }

  const pinRes = await getAllPins()
  const pins = pinRes.map(p => p.ipfs_pin_hash)

  console.log(`Pinata contains ${pins.length} pins.`)

  const rl = readline.createInterface({
    input: process.stdin
  })

  for await (const ln of rl) {
    const hash = ln.trim()
    if (!isIPFS.cid(hash)) {
      console.warn(`WARN: line not an IPFS CID: ${ln}`)
      continue
    }

    if (pins.includes(hash)) {
      console.log(`INFO: ${hash} already pinned`)
    } else {
      try {
        const res = await pinHash(hash)

        if (!res) {
          console.error(`ERROR: pinByHash request failed for ${hash}`)
        } else if (res.error) {
          console.error(`ERROR: ${res.error}`)
        }/* else if (res.status !== 'searching') {
          console.warn(`WARN: pinByHash(${hash}) request did not return expected status: ${res.status}`)
        }*/ else {
          console.log(`${hash} pinned. Status: ${res.status}`)
          // Pinata has a 120 RPM max limit
          await sleep(1000)
        }
      } catch (err) {
        console.error(`Error pinning ${hash}:`, err)
      }
    }
  }
}

if (require.main === module) {
  if (process.argv.length > 3) {
    console.log('Usage: ' + __filename + ' [SEARCH_TERM]')
    process.exit(-1)
  }

  main(process.argv.length === 3 ? process.argv[2] : undefined)
}
