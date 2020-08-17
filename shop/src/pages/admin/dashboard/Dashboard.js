import React, { useState } from 'react'
import get from 'lodash/get'
import fbt from 'fbt'

import useDashboardStats from 'utils/useDashboardStats'

import Chart from './_Chart'
import Loading from 'components/Loading'
import ProductImage from 'components/ProductImage'
import Price from 'components/Price'

const AdminDashboard = () => {
  const [sort, setSort] = useState('orders')
  const [range, setRange] = useState('all-time')

  const { dashboardStats, loading } = useDashboardStats(range, sort)

  const { orders, topProducts, totalRevenue, totalOrders } = dashboardStats

  if (loading && !orders) {
    return <Loading />
  }

  return (
    <>
      <h3 className="admin-title">
        <fbt desc="Dashboard">Dashboard</fbt>
        <div className="ml-auto" style={{ fontSize: 14 }}>
          <fbt desc="Range">Range</fbt>:
          <select
            className="ml-2"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="all-time">
              <fbt desc="admin.dashboard.allTime">All time</fbt>
            </option>
            <option value="30-days">
              <fbt desc="admin.dashboard.last30Days">Last 30 days</fbt>
            </option>
            <option value="7-days">
              <fbt desc="admin.dashboard.last7Days">Last 7 days</fbt>
            </option>
            <option value="yesterday">
              <fbt desc="Yesterday">Yesterday</fbt>
            </option>
            <option value="today">
              <fbt desc="Today">Today</fbt>
            </option>
          </select>
        </div>
      </h3>
      <div className="admin-dashboard-stats">
        <div className="stat-item">
          <img src="images/box.svg" className="stat-image" />
          <div className="stat-name">
            <fbt desc="admin.dashboard.totalOrders">Total orders</fbt>
          </div>
          <div className="stat-value">{totalOrders}</div>
        </div>
        <div className="stat-item">
          <img src="images/coins.svg" className="stat-image" />
          <div className="stat-name">
            <fbt desc="admin.dashboard.totalRevenue">Total revenue</fbt>
          </div>
          <div className="stat-value">
            <Price amount={totalRevenue} />
          </div>
        </div>
        {/* <h5 className="ml-4">{`${formatPrice(totalRevenue * 0.05)} profit`}</h5> */}
      </div>
      {!totalOrders ? null : (
        <div className="mt-4">
          <Chart orders={orders} />
        </div>
      )}
      {get(topProducts, 'length', 0) === 0 ? null : (
        <table className="table admin-products mt-4">
          <thead>
            <tr>
              <th colSpan="2">
                <fbt desc="admin.dashboard.topProducts">Top Products</fbt>
              </th>
              <th className="text-center">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setSort('orders')
                  }}
                >
                  <fbt desc="Sales">Sales</fbt>
                  {sort === 'orders' ? <> &#8595;</> : null}
                </a>
              </th>
              <th className="text-center">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setSort('revenue')
                  }}
                >
                  <fbt desc="Revenue">Revenue</fbt>
                  {sort === 'revenue' ? <> &#8595;</> : null}
                </a>
              </th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <ProductImage product={product} />
                </td>
                <td>
                  <div className="title">{product.title}</div>
                  <div className="price">
                    <Price amount={product.price} />
                  </div>
                </td>
                <td className="text-center">{product.orders}</td>
                <td className="text-center">
                  <Price amount={product.revenue} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default AdminDashboard

require('react-styl')(`
  .admin-dashboard-stats
    margin-top: 0.5rem
    display: flex
    color: #000
    .stat-item
      flex: 1
      border-radius: 10px
      padding: 0.875rem 1.25rem
      background-image: linear-gradient(to right, #007cff, #0072ea 100%)
      color: #fff

      display: flex
      align-items: center

      &:not(:last-child)
        margin-right: 1.5rem
      .stat-image
        height: 26px
        width: 26px
        margin-right: 1rem
      .stat-name
        font-size: 1rem
        flex: 1
      .stat-value
        font-size: 2.125rem
        font-weight: 600
  .admin .table
    thead th
      a
        color: #9faebd
        font-weight: bold
`)
