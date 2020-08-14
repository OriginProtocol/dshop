import React from 'react'
import { useLocation } from 'react-router-dom'
import fbt from 'fbt'
import { useStateValue } from 'data/state'
import Link from 'components/Link'
import Menu from 'components/admin/Menu'
import * as Icons from 'components/icons/Admin'
import LocaleSelect from 'components/LocaleSelect'

const AdminMenu = () => {
  const { pathname } = useLocation()
  const [{ admin }] = useStateValue()
  const active = (path) => (pathname.indexOf(path) === 0 ? 'active' : '')

  return (
    <Menu>
      <li className={`dashboard ${active('/admin/onboarding')}`}>
        <Link to="/admin/onboarding">
          <Icons.Home />
          <fbt desc="Home">Home</fbt>
        </Link>
      </li>
      <li className={`dashboard ${active('/admin/dashboard')}`}>
        <Link to="/admin/dashboard">
          <Icons.Dashboard />
          <fbt desc="Dashboard">Dashboard</fbt>
        </Link>
      </li>
      <li className={`orders ${active('/admin/orders')}`}>
        <Link to="/admin/orders">
          <Icons.Orders />
          <fbt desc="Orders">Orders</fbt>
        </Link>
      </li>
      <li className={`products ${active('/admin/products')}`}>
        <Link to="/admin/products">
          <Icons.Products />
          <fbt desc="Products">Products</fbt>
        </Link>
      </li>
      <li className={`collections ${active('/admin/collections')}`}>
        <Link to="/admin/collections">
          <Icons.Collections />
          <fbt desc="Collections">Collections</fbt>
        </Link>
      </li>
      <li className={`discounts ${active('/admin/discounts')}`}>
        <Link to="/admin/discounts">
          <Icons.Discounts />
          <fbt desc="Discounts">Discounts</fbt>
        </Link>
      </li>
      {admin.role !== 'admin' ? null : (
        <li className={`settings ${active('/admin/settings')}`}>
          <Link to="/admin/settings">
            <Icons.Settings />
            <fbt desc="Settings">Settings</fbt>
          </Link>
        </li>
      )}
      <li className="mt-auto">
        <div className="px-3">
          <LocaleSelect />
        </div>
      </li>
    </Menu>
  )
}

export default AdminMenu
