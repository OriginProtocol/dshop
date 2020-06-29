import React, { useMemo, useEffect } from 'react'

import { formInput, formFeedback } from 'utils/formHelpers'
import supportedTokens from 'data/supportedTokens'

import CreateListing from './_CreateListing'

const ContractSettings = ({ state, setState, config }) => {
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  useEffect(() => {
    setState({
      acceptedTokens: config.acceptedTokens || []
    })
  }, [config.acceptedTokens])

  const acceptedTokenIds = useMemo(() => {
    return (state.acceptedTokens || []).map((t) => t.id)
  }, [state.acceptedTokens])

  const updateAcceptedTokens = (tokenObj, selected) => {
    let acceptedTokens = [...state.acceptedTokens]
    if (selected) {
      acceptedTokens.push(tokenObj)
      acceptedTokens = Array.from(new Set([...acceptedTokens, tokenObj]))
    } else {
      acceptedTokens = acceptedTokens.filter((t) => t.id !== tokenObj.id)
    }

    setState({ acceptedTokens })
  }

  return (
    <div className="contract-settings">
      <h4>Other Payment Settings</h4>

      <div className="form-group">
        <label>Listing ID</label>
        <div className="d-flex">
          <div style={{ flex: 1 }}>
            <input {...input('listingId')} />
            {Feedback('listingId')}
          </div>
          <div className="mx-3 pt-1">or</div>
          <div style={{ flex: 1 }}>
            <CreateListing
              className="btn btn-outline-primary"
              onCreated={(listingId) => {
                setState({ listingId: `${config.netId}-001-${listingId}` })
              }}
              onError={(err) => setState({ createListingError: err })}
            >
              Create Listing
            </CreateListing>
            {Feedback('createListing')}
          </div>
        </div>
      </div>
      {/* <div className="form-group">
        <label>
          Arbitrator Address
          <span>
            (use an official Origin arbitrator address, or specify an
            alternative)
          </span>
        </label>
        <input {...input('arbitrator')} />
        {Feedback('arbitrator')}
      </div> */}
      <div className="form-group">
        <label>
          Dispute Window
          <span>
            (number of days after an offer is accepted that the seller can start
            a dispute)
          </span>
        </label>
        <input {...input('disputeWindow')} />
        {Feedback('disputeWindow')}
      </div>

      <label>Accepted Tokens</label>
      {supportedTokens.map((token) => (
        <div className="form-group" key={token.id}>
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={acceptedTokenIds.includes(token.id)}
              onChange={(e) => updateAcceptedTokens(token, e.target.checked)}
            />
            <label className="form-check-label">
              {token.displayName
                ? `${token.displayName} (${token.name})`
                : token.name}
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ContractSettings

require('react-styl')(`
  .admin .contract-settings
    border-top: 1px solid #cdd7e0
    margin-top: 3rem
    padding-top: 2rem
    max-width: 450px

    .form-check-label
      margin: 0
`)
