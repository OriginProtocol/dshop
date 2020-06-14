import useConfig from 'utils/useConfig'

function useBackendApi(opts = {}) {
  const { authToken } = opts
  const { config } = useConfig()

  const headers = { 'content-type': 'application/json' }
  if (authToken) {
    headers.authorization = `bearer ${config.backendAuthToken}`
  }

  function post(url, opts = {}) {
    return new Promise((resolve, reject) => {
      fetch(`${config.backend}${url}`, {
        headers,
        credentials: 'include',
        ...opts
      })
        .then((res) => res.json())
        .then((json) => {
          json.success ? resolve(json) : reject(new Error(json.reason))
        })
        .catch(reject)
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

  return { post, get }
}

export default useBackendApi
