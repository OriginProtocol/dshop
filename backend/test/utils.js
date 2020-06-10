const fetch = require('node-fetch')

const { ROOT_BACKEND_URL } = require('./const')

let _cookies = {}

function clearCookies() {
  _cookies = {}
}

function parseCookie(cstr) {
  const data = cstr.split(';').map((part) => part.trim())[0]
  return data.split('=')
}

function storeCookies(response) {
  const cookies = response.headers.raw()['set-cookie']

  if (!cookies) {
    return
  }

  for (const cookie of cookies) {
    const [key, val] = parseCookie(cookie)
    _cookies[key] = val
  }
}

function setCookies() {
  return Object.keys(_cookies)
    .map((key) => `${key}=${_cookies[key]}`)
    .join(';')
}

async function get(url, opts) {
  const headers = { cookie: setCookies() }

  if (opts && typeof opts.headers === 'object') {
    Object.keys(opts.headers).map((key) => {
      headers[key] = opts.headers[key]
    })
  }

  const response = await fetch(url, { headers })
  storeCookies(response)
  return await response.json()
}

async function post(url, body, opts) {
  const cookieHeader = setCookies()
  const headers = {
    'Content-Type': 'application/json',
    cookie: cookieHeader
  }

  if (opts && typeof opts.headers === 'object') {
    Object.keys(opts.headers).map((key) => {
      headers[key] = opts.headers[key]
    })
  }

  const response = await fetch(url, {
    method: 'post',
    body: JSON.stringify(body),
    headers
  })
  storeCookies(response)
  return await response.json()
}

async function apiRequest({ method, endpoint, body, headers }) {
  const url = `${ROOT_BACKEND_URL}${endpoint}`

  if (method === 'POST') {
    return await post(url, body, { headers })
  }

  if (body) {
    throw new Error('GET request cannot have a body')
  }

  return await get(url, { headers })
}

module.exports = {
  clearCookies,
  get,
  post,
  apiRequest
}
