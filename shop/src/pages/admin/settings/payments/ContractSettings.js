import React, { useMemo, useEffect } from 'react'

import { formInput } from 'utils/formHelpers'
import DefaultTokens from 'data/defaultTokens'

// import CreateListing from './_CreateListing'

import CustomTokenModal from './_CustomTokenModal'

const dedupArray = (arr, prop) => {
  const m = new Map()

  return arr.reduce((out, el) => {
    if (m.has(el[prop])) {
      return out
    }

    m.set(el[prop])
    return [...out, el]
  }, [])
}

const ContractSettings = ({ state, setState, config }) => {
  const input = formInput(state, (newState) => setState(newState))
  // const Feedback = formFeedback(state)

  useEffect(() => {
    const acceptedTokens = config.acceptedTokens || []
    setState({ acceptedTokens })
  }, [config.acceptedTokens])

  const acceptedTokenIds = useMemo(() => {
    return (state.acceptedTokens || []).map((t) => t.id)
  }, [state.acceptedTokens])

  const allTokensList = useMemo(() => {
    // Merge DefaultTokens and any custom tokens and return a deduplicated list of tokens
    return dedupArray([...DefaultTokens, ...(state.acceptedTokens || [])], 'id')
  }, [DefaultTokens, state.acceptedTokens])

  const updateAcceptedTokens = (tokenObj, selected) => {
    let acceptedTokens = [...state.acceptedTokens]
    if (selected) {
      acceptedTokens.push(tokenObj)
      acceptedTokens = dedupArray([...acceptedTokens, tokenObj], 'id')
    } else {
      acceptedTokens = acceptedTokens.filter((t) => t.id !== tokenObj.id)
    }

    setState({ acceptedTokens })
  }

  return (
    <div className="contract-settings">
      <h4>Other Payment Settings</h4>

      {/* <div className="form-group">
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
      <div className="form-group">
        <label>
          Arbitrator Address
          <span>
            (use an official Origin arbitrator address, or specify an
            alternative)
          </span>
        </label>
        <input {...input('arbitrator')} />
        {Feedback('arbitrator')}
      </div>
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
      </div> */}

      <label>Accepted Tokens</label>
      <div className="form-group">
        {allTokensList
          .filter((t) => t.address)
          .map((token) => (
            <div key={token.id} className="form-check">
              <label className="form-check-label">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={acceptedTokenIds.includes(token.id)}
                  onChange={(e) =>
                    updateAcceptedTokens(token, e.target.checked)
                  }
                />
                {token.displayName
                  ? `${token.displayName} (${token.name})`
                  : token.name}
              </label>
            </div>
          ))}
      </div>

      <CustomTokenModal
        onNewTokenAdded={(tokenObj) => updateAcceptedTokens(tokenObj, true)}
      />
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
