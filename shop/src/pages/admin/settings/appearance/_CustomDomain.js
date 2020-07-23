import React, { useEffect, useState } from 'react'
import get from 'lodash/get'

import PlusIcon from 'components/icons/Plus'
import Modal from 'components/Modal'

import useBackendApi from 'utils/useBackendApi'
import useAutoFocus from 'utils/useAutoFocus'
import { isValidDNSName } from 'utils/dns'
import { useStateValue } from 'data/state'

const CustomDomain = ({ netId, hostname = '' }) => {
  const [show, setShow] = useState()
  const [shouldClose, setShouldClose] = useState()
  const [domain, setDomain] = useState('')
  const [domainExists, setDomainExists] = useState(false)
  const [records, setRecords] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState({})
  const { post } = useBackendApi({ authToken: true })
  const [{ admin }] = useStateValue()
  const domainRef = useAutoFocus()

  const verifyDomain = async () => {
    if (verifyStatus.loading) return

    setVerifyStatus({ loading: true })

    try {
      const networkId = Number(netId)
      const body = JSON.stringify({ domain, hostname, networkId })

      const { success, valid, error } = await post('/domains/verify-dns', {
        body
      })
      setVerifyStatus({ success, valid, error })
    } catch (err) {
      console.error(err)
      setVerifyStatus({ error: 'Something went wrong. Try again later.' })
    }
  }

  useEffect(() => {
    if (!domain) return

    if (isValidDNSName(domain)) {
      setDomainExists(true)

      const networkId = Number(netId)
      const body = JSON.stringify({ domain, networkId })

      post('/domains/records', {
        body
      })
        .then((res) => {
          const { isApex, rrtype, rvalue } = res
          setRecords({ isApex, rrtype, rvalue })
        })
        .catch((err) => {
          console.error(err)
          setVerifyStatus({ error: 'Something went wrong. Try again later.' })
        })
    } else {
      setDomainExists(false)
    }
  }, [domain])

  const dnsLink = `dnslink=/ipns/${hostname}.${get(admin, 'network.domain')}`
  const txtRecord = `_dnslink.${domain} TXT "${dnsLink}"`

  const record = records
    ? `${domain} ${records.rrtype} ${records.rvalue}`
    : null

  return (
    <>
      <a
        onClick={(e) => {
          e.preventDefault()
          setShow(true)
        }}
        href="#"
        className="add"
      >
        <PlusIcon />
        Add a custom domain
      </a>
      {!show ? null : (
        <Modal
          onClose={() => {
            setShow(false)
            setShouldClose(false)
          }}
          shouldClose={shouldClose}
        >
          <div className="modal-body p-5 set-dns-records">
            <div className="text-lg text-center">Add a Custom Domain</div>
            <div className="mt-3">
              <div className="form-group">
                <label>Enter your domain:</label>
                <input
                  value={domain}
                  ref={domainRef}
                  onChange={(e) => setDomain(e.target.value)}
                  className="form-control"
                  placeholder="eg store.example.com"
                />
              </div>
              {!domain ? null : (
                <div className="records">
                  {!domainExists ? null : (
                    <>
                      <div>Please set the following DNS records:</div>
                      <div className="record">{record}</div>
                      <div className="record">{txtRecord}</div>
                    </>
                  )}
                </div>
              )}
            </div>
            {!verifyStatus.valid ? null : (
              <div className="alert alert-success my-3">
                Your DNS records look good.
              </div>
            )}
            {!verifyStatus.error ? null : (
              <div className="alert alert-warning my-3">
                {verifyStatus.error}
              </div>
            )}
            <div className="actions text-center">
              <button
                className="btn btn-primary px-5 mr-2"
                onClick={() => verifyDomain()}
                children="Verify"
              />

              <button
                className="btn btn-outline-primary px-5"
                onClick={() => setShouldClose(true)}
                children="Dismiss"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CustomDomain

require('react-styl')(`
  .set-dns-records
    .records
      margin-top: 1rem
      .record
        margin-top: 0.75rem
        font-family: monospace
`)
