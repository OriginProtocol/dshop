import React from 'react'
import { useLocation } from 'react-router-dom'

import useAuth from 'utils/useAuth'
import { useStateValue } from 'data/state'
import Link from 'components/Link'
import Menu from 'components/admin/Menu'
import * as Icons from 'components/icons/Admin'

const AdminMenu = () => {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const [{ admin }] = useStateValue()
  const active = (path) => (pathname.indexOf(path) === 0 ? 'active' : '')

  return (
    <Menu>
      <li className={`dashboard ${active('/admin/onboarding')}`}>
        <Link to="/admin/onboarding">
          <Icons.Home />
          Home
        </Link>
      </li>
      <li className={`dashboard ${active('/admin/dashboard')}`}>
        <Link to="/admin/dashboard">
          <Icons.Dashboard />
          Dashboard
        </Link>
      </li>
      <li className={`orders ${active('/admin/orders')}`}>
        <Link to="/admin/orders">
          <Icons.Orders />
          Orders
        </Link>
      </li>
      <li className={`products ${active('/admin/products')}`}>
        <Link to="/admin/products">
          <Icons.Products />
          Products
        </Link>
      </li>
      <li className={`collections ${active('/admin/collections')}`}>
        <Link to="/admin/collections">
          <Icons.Collections />
          Collections
        </Link>
      </li>
      <li className={`discounts ${active('/admin/discounts')}`}>
        <Link to="/admin/discounts">
          <Icons.Discounts />
          Discounts
        </Link>
      </li>
      {admin.role !== 'admin' ? null : (
        <li className={`settings ${active('/admin/settings')}`}>
          <Link to="/admin/settings">
            <Icons.Settings />
            Settings
          </Link>
        </li>
      )}
      <li className="db">
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
