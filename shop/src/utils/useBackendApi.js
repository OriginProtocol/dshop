import useConfig from 'utils/useConfig'

function useBackendApi(opts = {}) {
  const { authToken } = opts
  const { config } = useConfig()

  function postRaw(url, opts = {}) {
    const headers = { ...opts.headers }
    if (authToken) {
      headers.authorization = `bearer ${config.backendAuthToken}`
    }

    return new Promise((resolve, reject) => {
      fetch(`${config.backend}${url}`, {
        credentials: 'include',
        ...opts,
        headers
      })
        .then((res) => res.json())
        .then((json) => {
          json.success ? resolve(json) : reject(new Error(json.reason))
        })
        .catch(reject)
    })
  }

  function post(url, opts = {}) {
    return post(url, {
      ...opts,
      headers: {
        ...opts.headers,
        'content-type': 'application/json'
      }
    })
  }

  function get(url) {
    return new Promise((resolve, reject) => {
      fetch(`${config.backend}${url}`, {
        headers: { 'content-type': 'application/json' },
        credentials: 'include'
      })
        .then((res) => res.json())
        .then((json) => {
          json.success ? resolve(json) : reject(new Error(json.reason))
        })
        .catch(reject)
    })
  }

  return { post, postRaw, get }
}

export default useBackendApi
