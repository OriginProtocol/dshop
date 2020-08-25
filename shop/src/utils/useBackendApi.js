import useConfig from 'utils/useConfig'

function useBackendApi(opts = {}) {
  const { authToken } = opts
  const { config } = useConfig()

  function postRaw(url, opts = {}) {
    const headers = { ...opts.headers }
    if (authToken) {
      headers.authorization = `bearer ${encodeURIComponent(
        config.backendAuthToken
      )}`
    }
    if (!opts.method) {
      opts.method = 'POST'
    }

    return new Promise((resolve, reject) => {
      fetch(`${config.backend}${url}`, {
        credentials: 'include',
        ...opts,
        headers
      })
        .then((res) => (opts.rawData ? res.text() : res.json()))
        .then((json) => {
          if (opts.suppressError) {
            resolve(json)
          } else {
            json.success ? resolve(json) : reject(new Error(json.reason))
          }
        })
        .catch(reject)
    })
  }

  function post(url, opts = {}) {
    return postRaw(url, {
      ...opts,
      headers: {
        ...opts.headers,
        'content-type': 'application/json'
      }
    })
  }

  function get(url, opts = {}) {
    const headers = { 'content-type': 'application/json' }
    if (authToken) {
      headers.authorization = `bearer ${encodeURIComponent(
        config.backendAuthToken
      )}`
    }
    return new Promise((resolve, reject) => {
      fetch(`${config.backend}${url}`, { headers, credentials: 'include' })
        .then((res) => res.json())
        .then((json) => {
          if (opts.suppressError) {
            resolve(json)
          } else {
            json.success ? resolve(json) : reject(new Error(json.reason))
          }
        })
        .catch(reject)
    })
  }

  return { post, postRaw, get }
}

export default useBackendApi
