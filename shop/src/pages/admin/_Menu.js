import React from 'react'
import { useLocation } from 'react-router-dom'
import fbt from 'fbt'

import { useStateValue } from 'data/state'
import Link from 'components/Link'
import Caret from 'components/icons/Caret'
import Menu from 'components/admin/Menu'
import * as Icons from 'components/icons/Admin'
import LocaleSelect from 'components/LocaleSelect'

const AdminMenu = () => {
  const { pathname } = useLocation()
  const [{ admin }] = useStateValue()
  const active = (path, exact) => {
    if (exact) return pathname === path ? 'active' : ''
    return pathname.indexOf(path) === 0 ? 'active' : ''
  }

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
      {!/^admin$/i.test(admin.role) ? null : (
        <li className={`settings ${active('/admin/settings')}`}>
          <Link to="/admin/settings">
            <Icons.Settings />
            <fbt desc="Settings">Settings</fbt>
            <div
              className="caret"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                console.log('click')
              }}
            >
              <Caret />
            </div>
          </Link>
          {!active('/admin/settings') ? null : (
            <ul className="sub-menu list-unstyled">
              <li className={active('/admin/settings/general', true)}>
                <Link to="/admin/settings/general">
                  <fbt desc="General">General</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/appearance', true)}>
                <Link to="/admin/settings/appearance">
                  <fbt desc="Appearance">Appearance</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/payments')}>
                <Link to="/admin/settings/payments">
                  <fbt desc="Payments">Payments</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/apps')}>
                <Link to="/admin/settings/apps">
                  <fbt desc="Apps">Apps</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/shipping')}>
                <Link to="/admin/settings/shipping">
                  <fbt desc="Shipping">Shipping</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/checkout')}>
                <Link to="/admin/settings/checkout">
                  <fbt desc="Users">Checkout</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/users')}>
                <Link to="/admin/settings/users">
                  <fbt desc="Users">Users</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/deployments')}>
                <Link to="/admin/settings/deployments">
                  <fbt desc="Publish">Publish</fbt>
                </Link>
              </li>
              <li className={active('/admin/settings/advanced')}>
                <Link to="/admin/settings/advanced">
                  <fbt desc="Advanced">Advanced</fbt>
                </Link>
              </li>
              {!admin.superuser ? null : (
                <>
                  <li className={active('/admin/settings/server')}>
                    <Link to="/admin/settings/server">Server</Link>
                  </li>
                  <li className={active('/admin/settings/console')}>
                    <Link to="/admin/settings/console">Console</Link>
                  </li>
                </>
              )}
            </ul>
          )}
        </li>
      )}
      <li className="mt-auto">
        <div className="px-3 pt-4">
          <LocaleSelect />
        </div>
      </li>
    </Menu>
  )
}

export default AdminMenu
