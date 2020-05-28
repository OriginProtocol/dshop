import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'

import Link from 'components/Link'

import DeleteShop from './_Delete'
import DeployShop from './_Deploy'

const AdminShop = () => {
  const [{ admin }] = useStateValue()
  const match = useRouteMatch('/super-admin/shops/:shopId')
  const { shopId } = match.params

  const shops = get(admin, 'shops', [])
  const shop = shops.find((s) => s.authToken === shopId)
  if (!shop) {
    return <div>Loading...</div>
  }

  return (
    <>
      <h3 className="admin-title with-border">
        <Link to="/super-admin/shops" className="muted">
          Shops
        </Link>
        <span className="chevron" />
        {shop.name}
        <div className="ml-auto">
          <DeleteShop shopId={shopId} />
        </div>
      </h3>
      <DeployShop shopId={shopId} />
    </>
  )
}

export default AdminShop
