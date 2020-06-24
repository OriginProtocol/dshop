import React from 'react'

import { formInput, formFeedback } from 'utils/formHelpers'
import CreateListing from './_CreateListing'

const ContractSettings = ({ state, setState, config }) => {
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

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
      <div className="form-group">
        <label>Accepted Tokens</label>
        <div>
          <input type="checkbox" />
          Origin Tokens (OGN)
        </div>
        <div>
          <input type="checkbox" />
          Ether (ETH)
        </div>
        <div>
          <input type="checkbox" />
          Maker DAI (DAI)
        </div>
      </div>
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
`)
