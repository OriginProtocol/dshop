import React, { useState, useEffect } from 'react'
import _get from 'lodash/get'

import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import { isUnstoppableName } from '@origin/utils/dns'

import DeleteDomain from './_DeleteModal'
import EditHostname from './_EditHostname'
import DomainStatus from './_DomainStatus'
import AddButton from './_AddButton'
import EditCustomDomain from './_EditModal'
import OgnSubdomainStatus from './_OgnSubdomainStatus'

const Domains = ({ config, state }) => {
  const [{ admin, reload }] = useStateValue()
  const [hostnameModal, setHostnameModal] = useState(false)
  const [domainEdit, setDomainEdit] = useState(false)
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
              <OgnSubdomainStatus hostname={state.hostname} />
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
                <img src="images/edit-icon.svg" className="action-icon" />
              </a>
            </td>
          </tr>
          {domains.map((domain, idx) => {
            let onInfoClick

            if (domain.status === 'Pending') {
              onInfoClick = () => {
                setDomainEdit(domain)
              }
            }
            return (
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
                  <DomainStatus
                    status={domain.status}
                    onInfoClick={onInfoClick}
                  />
                </td>
                <td className="text-muted">
                  {isUnstoppableName(domain.domain) ? (
                    <fbt desc="Unstoppable">Unstoppable</fbt>
                  ) : (
                    <fbt desc="Other">Other</fbt>
                  )}
                </td>
                <td className="text-right">
                  <DeleteDomain domain={domain}>
                    <img src="images/delete-icon.svg" className="action-icon" />
                  </DeleteDomain>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="actions">
        <AddButton hostname={state.hostname} netId={config.netId} />
      </div>
      {!hostnameModal ? null : (
        <EditHostname onClose={() => setHostnameModal(false)} />
      )}
      {!domainEdit ? null : (
        <EditCustomDomain
          domainObj={domainEdit}
          hostname={state.hostname}
          netId={config.netId}
          onClose={() => setDomainEdit(null)}
        />
      )}
    </div>
  )
}

require('react-styl')(`
  .custom-domains
    .table td
      border-bottom: 1px solid #dee2e6
      border-top: 0px

    .action-icon
      cursor: pointer
`)

export default Domains
