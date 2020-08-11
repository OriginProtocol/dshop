import React, { useState } from 'react'

import PlusIcon from 'components/icons/Plus'
import Modal from 'components/Modal'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import useAutoFocus from 'utils/useAutoFocus'

const AddDomain = () => {
  const [, dispatch] = useStateValue()
  const [show, setShow] = useState()
  const [shouldClose, setShouldClose] = useState()
  const [domain, setDomain] = useState('')
  const { post } = useBackendApi({ authToken: true })
  const domainRef = useAutoFocus()

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
            setDomain('')
          }}
          shouldClose={shouldClose}
        >
          <form
            className="modal-body p-5 set-dns-records"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              post('/shop/domains', { body: JSON.stringify({ domain }) }).then(
                () => {
                  setShouldClose(true)
                  dispatch({ type: 'reload', target: 'domains' })
                }
              )
            }}
          >
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
            </div>
            <div className="actions text-center">
              <button
                type="button"
                className="btn btn-outline-primary px-5"
                onClick={() => setShouldClose(true)}
                children="Cancel"
              />
              <button className="btn btn-primary px-5 ml-2" children="Add" />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export default AddDomain

require('react-styl')(`
`)
