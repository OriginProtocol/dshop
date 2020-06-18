import React from 'react'
import { NavLink } from 'react-router-dom'

const SettingsTabs = () => {
  return (
    <ul className="nav nav-tabs mt-3">
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
        <NavLink className="nav-link" to="/admin/settings/users">
          Users
        </NavLink>
      </li>
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
    </ul>
  )
}

export default SettingsTabs
