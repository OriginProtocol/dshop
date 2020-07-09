import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'

const SwitchToStorefront = ({ className, children }) => {
  const location = useLocation()
  const history = useHistory()
  const [{ storefrontLocation }, dispatch] = useStateValue()

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!isAdmin) return
        dispatch({ type: 'setAdminLocation', location })
        history.push(storefrontLocation || '/')
      }}
    >
      {children}
    </button>
  )
}

export default SwitchToStorefront
