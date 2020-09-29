import React, { useEffect, useState } from 'react'
import get from 'lodash/get'
import fbt from 'fbt'

import useBackendApi from 'utils/useBackendApi'
import { isValidDNSName, isUnstoppableName } from '@origin/utils/dns'
import { useStateValue } from 'data/state'

const DomainInstructions = ({ domain, close, netId, hostname }) => {
  const [domainType, setDomainType] = useState(false)
  const [records, setRecords] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState({})
  const { post } = useBackendApi({ authToken: true })
  const [{ admin, deployments }] = useStateValue()

  const [loading, setLoading] = useState(true)

  const domainName = get(domain, 'domain')

  const verifyDomain = async () => {
    if (verifyStatus.loading) return

    setVerifyStatus({ loading: true })

    try {
      const networkId = Number(netId)
      const body = JSON.stringify({
        domain: domainName,
        hostname,
        networkId
      })

      const { success, valid, error } = await post('/domains/verify-dns', {
        body,
        suppressError: true
      })

      setVerifyStatus({ success, valid, error })
    } catch (err) {
      console.error(err)
      setVerifyStatus({
        error: fbt(
          'Something went wrong. Try again later.',
          'admin.settigns.general.domains.genericError'
        )
      })
    }
  }

  useEffect(() => {
    if (!domainName) return

    if (isUnstoppableName(domainName)) {
      setDomainType('unstoppable')
      setLoading(false)
      return
    }

    if (isValidDNSName(domainName)) {
      setDomainType('dns')

      const networkId = Number(netId)
      const body = JSON.stringify({ domain: domainName, networkId })

      post('/domains/records', {
        body
      })
        .then((res) => {
          const { isApex, rrtype, rvalue } = res
          setRecords({ isApex, rrtype, rvalue })
        })
        .catch((err) => {
          console.error(err)
          setVerifyStatus({
            error: fbt(
              'Something went wrong. Try again later.',
              'admin.settigns.general.domains.genericError'
            )
          })
        })
        .then(() => {
          setLoading(false)
        })
    }
  }, [domainName])

  const dnsLink = `dnslink=/ipns/${hostname}.${get(admin, 'network.domain')}`
  const txtHost = `_dnslink.${domainName}`
  const txtRecordVal = `"${dnsLink}"`

  const latestIPFSHash = deployments
    .map((x) => x.ipfsHash)
    .find((x) => Boolean(x))

  return (
    <div className="modal-body p-5 set-dns-records">
      <div className="text-lg text-center">
        {domainType === 'unstoppable' ? (
          <>Update Dshop IPFS hash</>
        ) : (
          <>Update your DNS records</>
        )}
      </div>
      <div className="mt-3">
        {loading ? (
          <>
            <fbt desc="Loading">Loading</fbt>...
          </>
        ) : domainType === 'unstoppable' ? (
          <div>
            <ol>
              <li>
                Go to{' '}
                <a
                  href="https://unstoppabledomains.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Unstoppable Domains
                </a>{' '}
                and click on “My Domains”
              </li>
              <li>
                Click “Manage” next to the .crypto domain you want to use for
                your Dshop store
              </li>
              <li>
                Add your Dshop IPFS hash in the “IPFS” field.
                <div className="mt-2">Your latest IPFS hash is:</div>
                <pre>{latestIPFSHash}</pre>
                <div className="note">
                  Note that if you publish your store again, a new IPFS hash
                  will be generated and you will need to update the “IPFS” field
                  on Unstoppable Domains with the new hash.{' '}
                </div>
              </li>
              <li>Changes might take a few minutes to be reflected.</li>
            </ol>
          </div>
        ) : domainType === 'dns' ? (
          <>
            <div>
              <fbt desc="admin.settigns.general.domains.setDNSRecords">
                Please set the following DNS records:
              </fbt>
            </div>
            <table className="table mt-3">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Host</th>
                  <th>Value/Data</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CNAME</td>
                  <td>@</td>
                  <td>{get(records, 'rvalue')}</td>
                </tr>
                <tr>
                  <td>TXT</td>
                  <td>{txtHost}</td>
                  <td>{txtRecordVal}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : null}
      </div>

      {!verifyStatus.valid ? null : (
        <div className="alert alert-success my-3">
          <fbt desc="admin.settigns.general.domains.validDNS">
            Your DNS records look good.
          </fbt>
        </div>
      )}

      {!verifyStatus.error ? null : (
        <div className="alert alert-warning my-3">{verifyStatus.error}</div>
      )}

      <div className="actions text-center">
        <button
          className="btn btn-primary px-5 mr-2"
          onClick={() => verifyDomain()}
          children={
            verifyStatus.loading
              ? `${fbt('Verifying', 'Verifying')}...`
              : fbt('Verify', 'Verify')
          }
          disabled={loading || verifyStatus.loading}
          type="button"
        />

        <button
          className="btn btn-outline-primary px-5"
          onClick={close}
          children={fbt('Dismiss', 'Dismiss')}
          type="button"
        />
      </div>
    </div>
  )
}

export default DomainInstructions

require('react-styl')(`
  @media (min-width: 799px)
    .modal-dialog
      max-width: 600px
  .set-dns-records
    ol
      a 
        color: #007bff
        font-decoration: underline

      .note
        color: #8293a4
        font-size: 0.875rem
        margin-bottom: 0.5rem

      pre 
        border: 1px solid #1990c6
        background-color: #f8fbff
        overflow-x: scroll
        margin-top: 5px
        padding: 3px 5px
`)
