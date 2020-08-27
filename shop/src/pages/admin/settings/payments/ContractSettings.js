import React from 'react'
import uniqBy from 'lodash/uniqBy'
import fbt from 'fbt'

import { formInput } from 'utils/formHelpers'
import DefaultTokens from 'data/defaultTokens'
import ConfirmationModal from 'components/ConfirmationModal'
import Toggle from 'components/Toggle'
import CustomTokenModal from './_CustomTokenModal'

const ContractSettings = ({ state, setState }) => {
  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )

  const acceptedTokens = state.acceptedTokens || []
  const customTokens = state.customTokens || []
  const customTokenIds = customTokens.map((t) => t.id)
  const acceptedTokenIds = acceptedTokens.map((t) => t.id)
  const allCustomTokens = uniqBy([...acceptedTokens, ...customTokens], 'id')
  const allTokens = uniqBy(
    [...DefaultTokens, ...allCustomTokens].filter((t) => t.address),
    'id'
  )

  return (
    <div className="contract-settings">
      <h4>
        <fbt desc="admin.settings.payments.otherPaymentSettings">
          Other Payment Settings
        </fbt>
      </h4>

      <label>
        <fbt desc="admin.settings.payments.cryptoPayments">
          Cryptocurrency Payments
        </fbt>
      </label>
      <div className="desc">
        <fbt desc="admin.settings.payments.acceptTokens">
          Accept Ethereum and other tokens as payment methods
        </fbt>
      </div>

      <div className="form-group mt-2">
        <div className="form-check">
          <label className="form-check-label">
            <input
              type="checkbox"
              className="form-check-input"
              checked={!state.disableCryptoPayments}
              onChange={(e) => {
                setState({
                  disableCryptoPayments: !e.target.checked,
                  hasChanges: true
                })
              }}
            />
            <fbt desc="admin.settings.payments.enableCryptoPayments">
              Enable cryptocurrency payments
            </fbt>
          </label>
        </div>
      </div>

      {state.disableCryptoPayments ? null : (
        <>
          <label>
            <fbt desc="admin.settings.payments.acceptedTokens">
              Accepted Tokens
            </fbt>
          </label>
          <div className="form-group">
            {allTokens.map((token) => (
              <div key={token.id} className="form-check d-flex">
                <label className="form-check-label">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={acceptedTokenIds.includes(token.id)}
                    onChange={(e) => {
                      const updatedList = e.target.checked
                        ? [...acceptedTokens, token]
                        : acceptedTokens.filter((t) => t.id !== token.id)
                      setState({
                        acceptedTokens: updatedList,
                        hasChanges: true
                      })
                    }}
                  />
                  {token.displayName
                    ? `${token.displayName} (${token.name})`
                    : token.name}
                </label>
                {!customTokenIds.includes(token.id) ? null : (
                  <AdminDeleteCustomToken
                    onConfirm={async () => {
                      const newAcceptedTokens = acceptedTokens.filter(
                        (t) => t.id !== token.id
                      )
                      const newCustomTokens = customTokens.filter(
                        (t) => t.id !== token.id
                      )
                      setState({
                        acceptedTokens: newAcceptedTokens,
                        customTokens: newCustomTokens,
                        hasChanges: true
                      })
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div>
            <CustomTokenModal
              onNewTokenAdded={(token) =>
                setState({
                  customTokens: [...customTokens, token],
                  acceptedTokens: [...acceptedTokens, token],
                  hasChanges: true
                })
              }
            />
          </div>

          <label className="mt-4">
            <fbt desc="Escrow">Escrow</fbt>
          </label>
          <div className="desc">
            <fbt desc="admin.settings.payments.useEscrowDesc">
              Crypto payments will be held in escrow on Origin Marketplace
              contract until buyer confirms receipt.
            </fbt>
          </div>
          <div className="form-group d-flex align-items-center mt-2">
            <Toggle
              className="sm"
              value={state.useEscrow ? true : false}
              onChange={(useEscrow) =>
                setState({ hasChanges: true, useEscrow })
              }
            >
              <div className="ml-2">
                <fbt desc="admin.settings.payments.useEscrow">
                  Use escrow contract
                </fbt>
              </div>
            </Toggle>
          </div>
        </>
      )}

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
    </div>
  )
}

const AdminDeleteCustomToken = ({ className = '', onConfirm }) => {
  return (
    <ConfirmationModal
      className={`btn btn-outline-danger ${className}`}
      customEl={
        <a
          href="#remove"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <img className="ml-3" src="images/delete-icon.svg" />
        </a>
      }
      buttonText={<fbt desc="Delete">Delete</fbt>}
      confirmText={
        <fbt desc="admin.settings.payments.tokenDeleteDesc">
          Are you sure you want to delete this token?
        </fbt>
      }
      confirmedText={
        <fbt desc="admin.settings.payments.tokenDeleted">Token deleted</fbt>
      }
      onConfirm={async () => onConfirm()}
      onSuccess={() => {}}
    />
  )
}

export default ContractSettings

require('react-styl')(`
  .admin .contract-settings
    border-top: 1px solid #cdd7e0
    margin-top: 3rem
    padding-top: 2rem

    .form-check-label
      margin: 0

    .desc
      color: #8293a4
      font-size: 0.875rem
      max-width: 500px
`)
