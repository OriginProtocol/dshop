import { useEffect, useState } from 'react'
import { useStateValue } from 'data/state'
import _get from 'lodash/get'
import memoize from 'lodash/memoize'
import useBackendApi from 'utils/useBackendApi'

const getAuth = memoize((as, get) => get('/auth', { suppressError: true }))

function useAuth(opts = {}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [{ admin, config, reload }, dispatch] = useStateValue()
  const { get, post } = useBackendApi()

  const backendUrl = _get(admin, 'backendUrl', window.location.origin)

  const shops = _get(admin, 'shops', [])
  const hasActiveShop = shops.find((s) => s.authToken === config.activeShop)

  useEffect(() => {
    const noShops = _get(admin, 'reason', '') === 'no-shops'
    if (config.activeShop && !hasActiveShop && !noShops) {
      dispatch({ type: 'reload', target: 'auth' })
    }
  }, [config.activeShop, hasActiveShop])

  useEffect(() => {
    let isSubscribed = true
    if (opts.only === undefined || opts.only()) {
      setLoading(true)
      getAuth(`${reload.auth}-${backendUrl}`, get)
        .then((auth) => {
          if (!isSubscribed) return
          if (_get(auth, 'success')) {
            localStorage.isAdmin = true
          }
          setLoading(false)
          dispatch({ type: 'setAuth', auth })
        })
        .catch(() => {
          if (!isSubscribed) return
          setError(true)
        })
    }
    return function cleanup() {
      isSubscribed = false
    }
  }, [reload.auth, backendUrl])

  function logout() {
    delete localStorage.isAdmin
    delete localStorage.activeShop
    getAuth.cache.clear()
    post(`/auth/logout`).then(() => {
      dispatch({ type: 'logout' })
    })
  }

  return { auth: admin, loading, error, logout }
}

export default useAuth
