import React, { useState } from 'react'
import fbt from 'fbt'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import useAutoFocus from 'utils/useAutoFocus'
import { isValidDNSName } from '@origin/utils/dns'

const DomainInput = ({ next, cancel }) => {
  const [, dispatch] = useStateValue()
  const [domain, setDomain] = useState('')
  const [error, setError] = useState('')
  const { post } = useBackendApi({ authToken: true })
  const domainRef = useAutoFocus()
  const [submitting, setSubmitting] = useState(false)

  return (
    <form
      className="modal-body p-5 set-dns-records"
      onSubmit={async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (submitting) return
        setSubmitting(true)

        if (!isValidDNSName(domain)) {
          setError(
            fbt(
              'Invalid domain name',
              'admin.settings.general.domains.invalidInput'
            )
          )
          setSubmitting(false)
          return
        }

        setError(null)

        try {
          const data = await post('/shop/domains', {
            body: JSON.stringify({ domain })
          })
          next(data)
        } catch (err) {
          console.error(err)
          dispatch({
            type: 'toast',
            message: fbt(
              'Something went wrong when trying add the custom domain. Please try again later',
              'admin.settings.general.domains.genericError'
            ),
            style: 'error'
          })
        } finally {
          setSubmitting(false)
        }
      }}
    >
      <div className="text-lg text-center">Add a Custom Domain</div>
      <div className="mt-3">
        <div className="form-group">
          <label>Enter a domain:</label>
          <input
            value={domain}
            ref={domainRef}
            onChange={(e) => setDomain(e.target.value)}
            className={`form-control${error ? ' is-invalid' : ''}`}
            placeholder="eg store.example.com, mystore.crypto, coolshop.eth"
          />
          {!error ? null : (
            <div className="invalid-feedback" style={{ display: 'block' }}>
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="actions text-center">
        <button
          type="button"
          className="btn btn-outline-primary px-5"
          onClick={cancel}
          children="Cancel"
        />
        <button
          className="btn btn-primary px-5 ml-2"
          children={
            submitting
              ? `${fbt('Submitting', 'Submitting')}...`
              : fbt('Submit', 'Submit')
          }
          disabled={submitting}
        />
      </div>
    </form>
  )
}

export default DomainInput
