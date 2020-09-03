import React, { useState, useEffect } from 'react'
import _get from 'lodash/get'

import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

import CustomDomain from './_AddDomain'
import DeleteDomain from './_DeleteDomain'
import EditHostname from './_EditHostname'
import InfoModal from './_InfoModal'
import DomainStatus from './_DomainStatus'

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
    <div className="form-group mt-4 mb-2 custom-domains">
      <label className="d-flex">
        <fbt desc="Domains">Domains</fbt>
      </label>
      <div className="desc mb-3">
        <fbt desc="admin.settings.general.customDomainDesc">
          Your default .ogn.app domain is already available. You have the option
          of adding additional ENS, .crypto or regular domain names. Changes can
          take up to 48 hours to be reflected.
        </fbt>
      </div>
      <table className="table mb-0">
        <thead>
          <tr>
            <th>
              <fbt desc="DomainName">Domain Name</fbt>
            </th>
            <th>
              <fbt desc="Status">Status</fbt>
            </th>
            <th>
              <fbt desc="Provider">Provider</fbt>
            </th>
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
              <DomainStatus
                status="ToPublish"
                onInfoClick={() =>
                  setInfoModal({
                    title: fbt(
                      'Publish your shop',
                      'admin.settings.general.domains.publishShop'
                    ),
                    description: fbt(
                      `Your store will be live on ${fbt.param(
                        'domain',
                        domain
                      )} once it has been published`,
                      'admin.settings.general.domains.publishDesc'
                    )
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
                <DomainStatus status={domain.status} />
              </td>
              <td className="text-muted">
                <fbt desc="Unstoppable">Unstoppable</fbt>
              </td>
              <td className="text-right">
                <DeleteDomain domain={domain}>
                  <img src="images/delete-icon.svg" />
                </DeleteDomain>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="actions">
        <CustomDomain hostname={state.hostname} netId={config.netId} />
      </div>
      {!hostnameModal ? null : (
        <EditHostname onClose={() => setHostnameModal(false)} />
      )}
      {!infoModal ? null : (
        <InfoModal {...infoModal} onClose={() => setInfoModal(false)} />
      )}
    </div>
  )
}

require('react-styl')(`
  .custom-domains
    .table td
      border-bottom: 1px solid #dee2e6
      border-top: 0px
`)

export default Domains
