import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'
import dayjs from 'dayjs'

import { useStateValue } from 'data/state'
import { NetworksById } from 'data/Networks'

import Paginate from 'components/Paginate'
import Link from 'components/Link'

function networkName(shop) {
  const network = get(NetworksById, shop.networkId, {})
  return network.name
}

const AdminShops = () => {
  const [{ admin }] = useStateValue()
  const history = useHistory()

  const shops = get(admin, 'shops', [])

  return (
    <>
      <h3 className="admin-title">
        Shops
        <div className="ml-auto">
          <Link to="/super-admin/shops/new" className="btn btn-primary">
            Create shop
          </Link>
        </div>
      </h3>
      <table className="table admin-discounts table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th className="text-center">Listing ID</th>
            <th>Created</th>
            <th className="text-center">Network</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shops.map((shop) => (
            <tr
              key={shop.id}
              onClick={() => {
                history.push(`/super-admin/shops/${shop.authToken}`)
              }}
            >
              <td>{shop.name}</td>
              <td className="text-center">{shop.listingId}</td>
              <td>{dayjs(shop.createdAt).format('MMM D, h:mm A')}</td>
              <td className="text-center">{networkName(shop)}</td>
              <td className="text-right">
                {!shop.viewable ? null : (
                  <>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        localStorage.activeShop = shop.authToken
                        window.open(location.origin)
                      }}
                      children="Storefront"
                    />
                    <span className="mx-2" style={{ color: '#999' }}>
                      |
                    </span>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        localStorage.activeShop = shop.authToken
                        history.push({
                          pathname: `/admin`,
                          state: { scrollToTop: true }
                        })
                      }}
                      children="Admin"
                    />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginate total={shops.length} />
    </>
  )
}

export default AdminShops
