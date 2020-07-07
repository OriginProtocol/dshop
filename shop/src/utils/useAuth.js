import { useEffect, useState } from 'react'
import { useStateValue } from 'data/state'
import _get from 'lodash/get'
import useBackendApi from 'utils/useBackendApi'

function useAuth(opts = {}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [{ auth, reload }, dispatch] = useStateValue()
  const { get, post } = useBackendApi()

  useEffect(() => {
    let isSubscribed = true
    if (!auth && (opts.only === undefined || opts.only())) {
      setLoading(true)

      get('/auth', { suppressError: true })
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
  }, [reload.auth])

  function logout() {
    delete localStorage.isAdmin
    delete localStorage.activeShop
    post(`/auth/logout`).then(() => {
      dispatch({ type: 'logout' })
    })
  }

  return { auth, loading, error, logout }
}

export default useAuth
