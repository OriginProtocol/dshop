import React from 'react'
import { useLocation } from 'react-router-dom'

import { useStateValue } from 'data/state'

const SwitchToStorefront = ({ className, children }) => {
  const location = useLocation()
  const [{ storefrontLocation, config }, dispatch] = useStateValue()

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  let url = window.origin + (storefrontLocation || '/')
  if (config.themeId) {
    url = `${window.origin}/theme/${config.themeId}?shop=${config.backendAuthToken}`
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!isAdmin) return
        dispatch({ type: 'setAdminLocation', location })
        window.open(url, 'shop_preview')
      }}
    >
      {children}
    </button>
  )
}

export default SwitchToStorefront
