import { useEffect, useState } from 'react'
import { useStateValue } from 'data/state'
import _get from 'lodash/get'
import memoize from 'lodash/memoize'
import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'

import { isLoggedIn } from 'utils/auth'

const getAuth = memoize((as, get) => get('/auth', { suppressError: true }))

function useAuth(opts = {}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [{ admin, config, reload }, dispatch] = useStateValue()
  const { get, post } = useBackendApi()
  const { setActiveShop } = useConfig()

  const backendUrl = _get(admin, 'backendUrl', window.location.origin)

  const shops = _get(admin, 'shops', [])
  const hasActiveShop = shops.find((s) => s.authToken === config.activeShop)
  const notLoggedIn = !isLoggedIn(admin)

  useEffect(() => {
    if (notLoggedIn) {
      return
    }

    const noShops = _get(admin, 'reason', '') === 'no-shops'
    if (admin && config.activeShop && !hasActiveShop && !noShops) {
      dispatch({ type: 'reload', target: 'auth' })
    }
  }, [config.activeShop, hasActiveShop, notLoggedIn])

  useEffect(() => {
    let isSubscribed = true
    if (!opts.only || opts.only()) {
      setLoading(true)
      localStorage.isAdmin = true
      getAuth(`${reload.auth}-${backendUrl}`, get)
        .then((auth) => {
          if (!isSubscribed) return
          setLoading(false)
          const hasActiveShop = _get(auth, 'shops', []).find(
            (s) => s.authToken === config.activeShop
          )
          // Reset active shop if it doesn't appear in list of authorized shops
          if (!hasActiveShop) {
            setActiveShop(null)
          }

          dispatch({ type: 'setAuth', auth })
        })
        .catch((err) => {
          if (!isSubscribed) return
          console.error(err)
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
