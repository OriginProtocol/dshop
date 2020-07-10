import React from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { NetworksById } from 'data/Networks'
import { useStateValue } from 'data/state'

import Paginate from 'components/Paginate'
import Link from 'components/Link'

const AdminShops = () => {
  const [{ admin }] = useStateValue()
  const history = useHistory()

  const networks = get(admin, 'networks', [])

  return (
    <>
      <h3 className="admin-title">
        Networks
        <div className="actions">
          <Link to="/super-admin/networks/new" className="btn btn-primary">
            Create network
          </Link>
        </div>
      </h3>
      <table className="table admin-discounts table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th className="text-center">ID</th>
            <th>Domain</th>
            <th>Pinner</th>
            <th>DNS Provider</th>
          </tr>
        </thead>
        <tbody>
          {networks.map((network) => (
            <tr
              key={network.networkId}
              onClick={() => {
                history.push(`/super-admin/networks/${network.networkId}`)
              }}
            >
              <td>
                {get(NetworksById, `[${network.networkId}].name`, 'Custom')}
                {network.active ? ' ✅' : ''}
              </td>
              <td className="text-center">{network.networkId}</td>
              <td>{network.domain}</td>
              <td>{network.pinataKey ? 'Pinata' : ''}</td>
              <td>{network.cloudflareEmail ? 'Cloudflare' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginate total={networks.length} />
    </>
  )
}

export default AdminShops
