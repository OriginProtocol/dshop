import React from 'react'
import { NavLink, useRouteMatch, Switch, Route } from 'react-router-dom'

import get from 'lodash/get'
import fbt from 'fbt'

import useAdminOrder from 'utils/useAdminOrder'
import { useStateValue } from 'data/state'

import Link from 'components/Link'

import OrderDetails from './Details'
import Printful from './Printful'
import Contract from './Contract'

const AdminOrder = () => {
  const match = useRouteMatch('/admin/orders/:orderId/:tab?')
  const { orderId, tab } = match.params
  const { order, loading } = useAdminOrder(orderId)
  const [{ admin }] = useStateValue()
  const urlPrefix = `/admin/orders/${orderId}`
  const prevOrderId = get(order, 'prevOrderId')
  const nextOrderId = get(order, 'nextOrderId')

  return (
    <>
      <h3 className="admin-title">
        <Link to="/admin/orders" className="muted">
          <fbt desc="Orders">Orders</fbt>
        </Link>
        <span className="chevron" />
        {`Order #${orderId}`}
        <div style={{ fontSize: 18 }} className="actions">
          {prevOrderId ? (
            <Link to={`/admin/orders/${prevOrderId}${tab ? `/${tab}` : ''}`}>
              &lt; <fbt desc="Older">Older</fbt>
            </Link>
          ) : null}
          {nextOrderId ? (
            <Link to={`/admin/orders/${nextOrderId}${tab ? `/${tab}` : ''}`}>
              <fbt desc="Newer">Newer</fbt> &gt;
            </Link>
          ) : null}
        </div>
      </h3>
      {!get(order, 'data.error') ? null : (
        <div className="alert alert-danger">{order.data.error}</div>
      )}
      <ul className="nav nav-tabs mt-3 mb-4">
        <li className="nav-item">
          <NavLink className="nav-link" to={urlPrefix} exact>
            <fbt desc="Details">Details</fbt>
          </NavLink>
        </li>
        {!/^admin$/i.test(admin.role) ? null : (
          <li className="nav-item">
            <NavLink className="nav-link" to={`${urlPrefix}/printful`}>
              Printful
            </NavLink>
          </li>
        )}
        {!/^admin$/i.test(admin.role) ? null : (
          <li className="nav-item">
            <NavLink className="nav-link" to={`${urlPrefix}/contract`}>
              <fbt desc="Contract">Contract</fbt>
            </NavLink>
          </li>
        )}
      </ul>
      {loading ? (
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      ) : (
        <Switch>
          <Route path={`${urlPrefix}/printful`}>
            <Printful />
          </Route>
          <Route path={`${urlPrefix}/contract`}>
            <Contract order={order} />
          </Route>
          <Route>
            <OrderDetails order={order} />
          </Route>
        </Switch>
      )}
    </>
  )
}

export default AdminOrder

require('react-styl')(`
  .nav-tabs
    .nav-link
      padding: 0.5rem 0.25rem
      margin-right: 2rem
      border-width: 0 0 4px 0
      color: #666666
      &:hover
        border-color: transparent
      &.active
        border-color: #3b80ee
        color: #000
`)
