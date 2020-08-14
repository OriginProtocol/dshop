import React from 'react'
import { NavLink } from 'react-router-dom'
import fbt from 'fbt'
import { useStateValue } from 'data/state'

const SettingsTabs = () => {
  const [{ admin }] = useStateValue()

  return (
    <ul className="nav nav-tabs">
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings" exact>
          <fbt desc="General">General</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/payments">
          <fbt desc="Payments">Payments</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/apps">
          <fbt desc="Apps">Apps</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/shipping">
          <fbt desc="Shipping">Shipping</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/users">
          <fbt desc="Users">Users</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/deployments">
          <fbt desc="Publish">Publish</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/settings/advanced">
          <fbt desc="Advanced">Advanced</fbt>
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
