import React from 'react'
import { useLocation } from 'react-router-dom'

import useAuth from 'utils/useAuth'
import Link from 'components/Link'
import Menu from 'components/admin/Menu'
import * as Icons from 'components/icons/Admin'

const AdminMenu = () => {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const active = (path) => (pathname.indexOf(path) === 0 ? 'active' : '')

  return (
    <Menu>
      <li className={`dashboard ${active('/super-admin/dashboard')}`}>
        <Link to="/super-admin/dashboard">
          <Icons.Home />
          Dashboard
        </Link>
      </li>
      <li className={`settings ${active('/super-admin/networks')}`}>
        <Link to="/super-admin/networks">
          <Icons.Settings />
          Networks
        </Link>
      </li>
      <li className={`orders ${active('/super-admin/shops')}`}>
        <Link to="/super-admin/shops">
          <Icons.Orders />
          Shops
        </Link>
      </li>
      <li className={`settings ${active('/super-admin/users')}`}>
        <Link to="/super-admin/users">
          <Icons.User />
          Users
        </Link>
      </li>
      <li>
        <a
          href="#logout"
          onClick={(e) => {
            e.preventDefault()
            logout()
          }}
        >
          <Icons.Logout />
          Logout
        </a>
      </li>
    </Menu>
  )
}

export default AdminMenu
