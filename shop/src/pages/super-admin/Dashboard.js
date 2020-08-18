import React from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'

const SuperAdminDashboard = () => {
  const [{ admin }] = useStateValue()
  const network = get(admin, 'network', {})

  return (
    <>
      <div className="d-flex mb-3 align-items-center">
        <h3 className="m-0">Dashboard</h3>
      </div>
      <div className="admin-dashboard-stats">
        <div className="stat-item">
          <img src="images/box.svg" className="stat-image" />
          <div className="stat-name">Active Network ID</div>
          <div className="stat-value">{network.networkId}</div>
        </div>
        <div className="stat-item">
          <img src="images/coins.svg" className="stat-image" />
          <div className="stat-name">Total shops</div>
          <div className="stat-value">{get(admin, 'shopsCount', 0)}</div>
        </div>
      </div>
    </>
  )
}

export default SuperAdminDashboard
