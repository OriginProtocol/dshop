import React from 'react'
import { useLocation } from 'react-router-dom'

import { useStateValue } from 'data/state'

const SwitchToStorefront = ({ className, children }) => {
  const location = useLocation()
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
        window.open(window.origin + (storefrontLocation || '/'), 'shop_preview')
      }}
    >
      {children}
    </button>
  )
}

export default SwitchToStorefront
