import React from 'react'
import { NavLink } from 'react-router-dom'

import { useStateValue } from 'data/state'

const SettingsTabs = () => {
  const [{ admin }] = useStateValue()

  return (
    <ul className="nav nav-tabs">
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings" exact>
          Appearance
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/payments">
          Payments
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/apps">
          Apps
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/shipping">
          Shipping
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/users">
          Users
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/deployments">
          Publish
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/advanced">
          Advanced
        </NavLink>
      </li>
      {!admin.superuser ? null : (
        <>
          <li className="nav-item">
            <NavLink className="nav-link" to="/admin/settings/server">
              Server
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" to="/admin/settings/console">
              Console
            </NavLink>
          </li>
        </>
      )}
    </ul>
  )
}

export default SettingsTabs
