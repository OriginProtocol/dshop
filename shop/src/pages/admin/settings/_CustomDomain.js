import React, { useState } from 'react'

import PlusIcon from 'components/icons/Plus'
import Modal from 'components/Modal'

const CustomDomain = ({ hostname = '' }) => {
  const [show, setShow] = useState()
  const [shouldClose, setShouldClose] = useState()
  const [domain, setDomain] = useState('')
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
                  onChange={(e) => setDomain(e.target.value)}
                  className="form-control"
                  placeholder="eg store.example.com"
                />
              </div>
              {!domain ? null : (
                <div className="records">
                  <div className="mb-2">
                    Please set the following DNS records:
                  </div>
                  <div className="record">{`${domain} CNAME ipfs-prod.ogn.app`}</div>
                  <div className="record">{`_dnslink.${domain} TXT ${hostname}.ogn.app`}</div>
                </div>
              )}
            </div>
            <div className="actions text-center">
              <button
                className="btn btn-primary px-5"
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
        font-family: monospace
`)
