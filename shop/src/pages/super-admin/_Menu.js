import React from 'react'
import { useLocation } from 'react-router-dom'

import Link from 'components/Link'
import Menu from 'components/admin/Menu'
import * as Icons from 'components/icons/Admin'

const AdminMenu = () => {
  const { pathname } = useLocation()
  const active = (path) => (pathname.indexOf(path) === 0 ? 'active' : '')

  return (
    <Menu>
      <li className={active('/super-admin/dashboard')}>
        <Link to="/super-admin/dashboard">
          <Icons.Home />
          Dashboard
        </Link>
      </li>
      <li className={active('/super-admin/networks')}>
        <Link to="/super-admin/networks">
          <Icons.Settings />
          Networks
        </Link>
      </li>
      <li className={active('/super-admin/shops')}>
        <Link to="/super-admin/shops">
          <Icons.Orders />
          Shops
        </Link>
      </li>
      <li className={active('/super-admin/users')}>
        <Link to="/super-admin/users">
          <Icons.User />
          Users
        </Link>
      </li>
    </Menu>
  )
}

export default AdminMenu
