import React, { useState, useEffect } from 'react'
import _get from 'lodash/get'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

import CustomDomain from './_AddDomain'
import DeleteDomain from './_DeleteDomain'
import EditHostname from './_EditHostname'
import InfoModal from './_InfoModal'

const Domains = ({ config, state }) => {
  const [{ admin, reload }] = useStateValue()
  const [hostnameModal, setHostnameModal] = useState(false)
  const [infoModal, setInfoModal] = useState(false)
  const [domains, setDomains] = useState([])
  const { get } = useBackendApi({ authToken: true })

  useEffect(() => {
    get('/shop/domains').then(({ domains }) => setDomains(domains))
  }, [reload.domains])

  const domain = `${state.hostname}.${_get(admin, 'network.domain')}`

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
              <span className="badge badge-warning">Awaiting Publish</span>
              <img
                src="images/info-icon.svg"
                width="16"
                className="ml-2"
                onClick={() =>
                  setInfoModal({
                    title: 'Publish your shop',
                    description: `Your store will be live on ${domain} once it has been published`
                  })
                }
              />
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
          {domains.map((domain, idx) => (
            <tr key={idx}>
              <td>
                <a
                  onClick={(e) => e.preventDefault()}
                  href={domain}
                  target="_blank"
                  rel="noreferrer"
                  children={domain.domain}
                />
              </td>
              <td>
                <span className="badge badge-warning">
                  {/*domain.status*/}Pending Registration
                </span>
              </td>
              <td className="text-muted">Unstoppable</td>
              <td className="text-right">
                <DeleteDomain domain={domain}>
                  <img src="images/delete-icon.svg" />
                </DeleteDomain>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!hostnameModal ? null : (
        <EditHostname onClose={() => setHostnameModal(false)} />
      )}
      {!infoModal ? null : (
        <InfoModal {...infoModal} onClose={() => setInfoModal(false)} />
      )}
    </div>
  )
}

export default Domains
