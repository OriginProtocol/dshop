import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import Price from 'components/Price'
import Tooltip from 'components/Tooltip'
import Paginate from 'components/Paginate'
import NoItems from 'components/NoItems'
import PaymentStatusText from 'components/PaymentStatusText'

import useOrders from 'utils/useOrders'

const AdminOrders = () => {
  const location = useLocation()
  const history = useHistory()
  const [searchInput, setSearchInput] = useState('')
  const [csv, setCsv] = useState(false)
  const searchRef = useRef(null)

  const urlQuery = get(location, 'search', '')
  const { searchVal, pageId } = useMemo(() => {
    const urlQueryObj = new URLSearchParams(urlQuery)
    return {
      searchVal: urlQueryObj.get('search') || '',
      pageId: urlQueryObj.get('page')
    }
  }, [urlQuery])

  const { orders, ordersPagination, loading, reload } = useOrders(
    pageId,
    searchVal
  )

  useEffect(() => setSearchInput(searchVal), [searchVal])
  useEffect(() => {
    if (!searchRef.current) return

    const listener = (e) => {
      const urlQueryObj = new URLSearchParams(urlQuery)
      if (e.target.value) {
        urlQueryObj.set('search', e.target.value)
        urlQueryObj.delete('page') // Reset pagination
      } else {
        urlQueryObj.delete('search')
      }

      history.push(`${location.pathname}?${urlQueryObj.toString()}`)
    }

    const keypressListener = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        listener(e)
      }
    }

    searchRef.current.addEventListener('keydown', keypressListener)
    return () => {
      if (searchRef.current) {
        searchRef.current.removeEventListener('keydown', keypressListener)
      }
    }
  }, [searchRef.current, location, urlQuery])

  const headerSection = (
    <div className="d-flex align-items-center justify-content-between mb-4">
      <h3 className="m-0">
        <fbt desc="Orders">Orders</fbt>
      </h3>
      {!orders.length && !searchVal ? null : (
        <>
          <input
            ref={searchRef}
            type="search"
            className="form-control mx-4"
            placeholder={fbt('Search', 'Search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => reload()}
          >
            &#8635;
          </button>
          <button
            className={`btn btn-sm btn${csv ? '' : '-outline'}-secondary ml-2`}
            onClick={() => setCsv(!csv)}
          >
            CSV
          </button>
        </>
      )}
    </div>
  )

  if (!orders.length) {
    return (
      <>
        {headerSection}
        {searchVal ? (
          <NoItems
            heading={fbt(
              'No matching orders!',
              'admin.Orders.noMatchingOrders'
            )}
            description={
              <fbt desc="admin.Orders.zeroSearchResults">
                Your search for{' '}
                <FbtParam name="searchVal">{searchVal}</FbtParam> returned
                nothing.
              </fbt>
            }
          />
        ) : (
          <NoItems
            heading={fbt('No orders yet!', 'admin.Orders.noOrders')}
            description={fbt(
              'Generate some sales and orders will appear here.',
              'admin.Orders.genSales'
            )}
          />
        )}
      </>
    )
  }

  return (
    <>
      {headerSection}
      {loading ? (
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      ) : csv ? (
        <AdminOrdersCSV orders={orders} />
      ) : (
        <AdminOrdersTable orders={orders} />
      )}

      <Paginate
        total={ordersPagination.totalCount}
        perPage={ordersPagination.perPage}
      />
    </>
  )
}

function customerName(order) {
  const firstName = get(order, 'data.userInfo.firstName', '')
  const lastName = get(order, 'data.userInfo.lastName', '')
  return `${firstName} ${lastName}`
}

const AdminOrdersTable = ({ orders }) => {
  const history = useHistory()

  return (
    <table className="table admin-orders table-hover">
      <thead>
        <tr>
          <th>
            <fbt desc="Order">Order</fbt>
          </th>
          <th>
            <fbt desc="Time">Time</fbt>
          </th>
          <th>
            <fbt desc="Customer">Customer</fbt>
          </th>
          <th>
            <fbt desc="Payment">Payment</fbt>
          </th>
          <th>
            <fbt desc="Total">Total</fbt>
          </th>
          <th>
            <fbt desc="Status">Status</fbt>
          </th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order.orderId}
            onClick={() => {
              history.push(`/admin/orders/${order.orderId}`)
            }}
          >
            <td>
              {!get(order, 'data.error') ? null : (
                <Tooltip text={order.data.error}>
                  <img
                    src="images/error-icon.svg"
                    className="error-icon mr-2"
                  />
                </Tooltip>
              )}
              {order.orderId}
            </td>
            <td>{dayjs(order.createdAt).format('MMM D, h:mm A')}</td>
            <td>{customerName(order)}</td>
            <td>{get(order, 'data.paymentMethod.label')}</td>
            <td>
              <Price amount={get(order, 'data.total')} />
            </td>
            <td>
              <PaymentStatusText status={order.paymentStatus} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const fields = `
  Order,orderId
  Payment,data.paymentMethod.label
  Total,data.total,number
  Donation,data.donation,number
  Item IDs,data.items,product
  First Name,data.userInfo.firstName
  Last Name,data.userInfo.lastName
  Email,data.userInfo.email
  Phone,data.userInfo.phone
  Address1,data.userInfo.address1
  Address2,data.userInfo.address2
  City,data.userInfo.city
  Province,data.userInfo.province
  Zip,data.userInfo.zip
  Country,data.userInfo.country`
  .split('\n')
  .filter((i) => i)
  .map((i) => i.trim().split(','))

const AdminOrdersCSV = ({ orders }) => {
  const cols = fields.map((f) => f[0]).join(',')
  const data = orders
    .slice()
    .reverse()
    .map((order) => {
      try {
        const joined = fields
          .map(([, field, filter]) => {
            let value = get(order, field, '')
            if (filter === 'number') {
              value = (value / 100).toFixed(2)
            }
            if (filter === 'product') {
              value = value.map((i) => i.product).join(',')
            }
            return '"' + value + '"'
          })
          .join(',')
        return joined
      } catch (e) {
        /* Ignore */
      }
    })
  return (
    <div className="admin-orders">
      <textarea
        className="form-control"
        rows="10"
        readOnly
        value={[cols, ...data].filter((a) => a).join('\n')}
      />
    </div>
  )
}

export default AdminOrders

require('react-styl')(`
  .admin-orders
    tbody tr
      cursor: pointer
    textarea
      white-space: pre
      overflow: auto
      min-height: calc(100vh - 175px)
`)
