import React, { useEffect } from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import CountryTaxEntry from './_CountryTaxEntry'

const ManualTaxes = ({ state, setState }) => {
  const taxRates = get(state, 'taxRates')

  useEffect(() => {
    if (!taxRates || !taxRates.length) {
      setState({
        taxRates: [{}]
      })
    }
  }, [taxRates])
  return (
    <div className="manual-taxes">
      <div className="form-group">
        <label className="mb-0">
          <fbt desc="Taxes">Taxes</fbt>
        </label>
        <div className="desc mb-3">
          <fbt desc="admin.settings.checkout.taxesDesc">
            Charge taxes on your orders. By enabling this features, you
            acknowledge that it is up to you and a tax professional to determine
            when and how much tax to collect and remit, and if this feature is
            right for you.
          </fbt>
        </div>
        {/**
         * TODO: We still haven't figured this out. We don't store
         * the user's address anywhere, so showing product prices with
         * taxes is impossible right now.
         */}
        {/* <label className="form-check mb-3 font-weight-normal">
          <input
            className="form-check-input"
            type="checkbox"
            checked={state.includeTaxes ? true : false}
            onChange={(e) =>
              setState({ includeTaxes: e.target.checked, hasChanges: true })
            }
          />
          <fbt desc="admin.settings.checkout.includeTaxes">
            Show all prices with tax included
          </fbt>
        </label> */}
      </div>

      <div className="tax-entries-wrapper">
        {(taxRates || []).map((taxRateEntry, index) => (
          <CountryTaxEntry
            key={taxRateEntry.country || index}
            entry={taxRateEntry}
            onChange={(updatedVal) => {
              const newRates = [...taxRates]
              newRates[index] = {
                ...taxRates[index],
                ...updatedVal
              }

              setState({
                taxRates: newRates,
                hasChanges: true
              })
            }}
            onRemove={() => {
              const newRates = [...taxRates]
              newRates.splice(index, 1)
              if (!newRates.length) {
                newRates.push({})
              }
              setState({
                taxRates: newRates,
                hasChanges: true
              })
            }}
          />
        ))}
      </div>

      <div>
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={() => {
            setState({
              taxRates: [...taxRates, {}]
            })
          }}
        >
          <fbt desc="admin.settings.checkout.addCountry">
            Add another country
          </fbt>
        </button>
      </div>
    </div>
  )
}

export default ManualTaxes

require('react-styl')(`
  .manual-taxes
    .btn.btn-outline-primary
      border-radius: 17.5px
      padding-left: 1.5rem
      padding-right: 1.5rem

    .tax-entries-wrapper
      background-color: #fafbfc
      padding: 0.75rem
      margin-bottom: 1rem
`)
