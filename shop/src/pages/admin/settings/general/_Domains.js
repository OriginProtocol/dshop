import React, { useState } from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'

import CustomDomain from './_CustomDomain'
import EditHostname from './_EditHostname'

const Domains = ({ config, state }) => {
  const [{ admin }] = useStateValue()
  const [hostnameModal, setHostnameModal] = useState(false)

  const domain = `https://${state.hostname}.${get(admin, 'network.domain')}`

  return (
    <div className="form-group mt-4 mb-2">
      <label className="d-flex">
        Domains
        <div
          className="ml-auto d-flex"
          style={{ fontSize: 14, fontWeight: 'normal' }}
        >
          <CustomDomain hostname={state.hostname} netId={config.netId} />
        </div>
      </label>
      <table className="table mb-0">
        <thead>
          <tr>
            <th>Domain Name</th>
            <th>Status</th>
            <th>Provider</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a
                onClick={(e) => e.preventDefault()}
                href={domain}
                target="_blank"
                rel="noreferrer"
                children={domain}
              />
            </td>
            <td>
              <span className="badge badge-warning">Pending</span>
            </td>
            <td className="text-muted">Origin</td>
            <td className="text-right">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setHostnameModal(true)
                }}
              >
                <img src="images/edit-icon.svg" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      {!hostnameModal ? null : (
        <EditHostname onClose={() => setHostnameModal(false)} />
      )}
    </div>
  )
}

export default Domains
