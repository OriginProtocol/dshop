import React, { useEffect } from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import { formFeedback } from 'utils/formHelpers'

import MultiSelect from './_CountriesMultiSelect'
import RateEdit from './_RateEdit'

const ShippingDestination = ({
  destInfo,
  disableCountrySelectbox,
  onChange,
  onDelete,
  canDelete
}) => {
  const countries = get(destInfo, 'countries', [])
  const rates = get(destInfo, 'rates', [])

  const Feedback = formFeedback(destInfo)

  useEffect(() => {
    const newState = {}

    if (!rates || !rates.length) {
      newState.rates = [
        {
          amount: get(destInfo, 'amount', 0) / 100,
          type: ''
        }
      ]
    }

    if (Object.keys(newState).length > 0) {
      onChange(newState)
    }
  }, [rates])

  return (
    <div className="shipping-destination row">
      <div className="col-md-4">
        <div className="label">
          <fbt desc="admin.settings.shipping.Destination">Destination</fbt>
        </div>
        {disableCountrySelectbox ? (
          <div className="label">
            {countries.length > 0 ? (
              countries.join(',')
            ) : (
              <fbt desc="admin.settings.shipping.restOfTheWorld">
                Rest of the world
              </fbt>
            )}
          </div>
        ) : (
          <>
            <MultiSelect
              selected={countries || []}
              onChange={(countries) =>
                onChange({ countries, countriesError: false })
              }
              includeGlobalOption={true}
              className={destInfo.countriesError ? 'invalid-feedback' : ''}
            />
            {Feedback('countries')}
          </>
        )}
      </div>

      <div className="col-md-8">
        {rates.map((rate, index) => (
          <RateEdit
            key={index}
            rateInfo={rate}
            onChange={(updatedRate) => {
              const rates = [...destInfo.rates]
              rates[index] = updatedRate
              onChange({ rates })
            }}
            hideLabel={index > 0}
            onDelete={() => {
              const rates = [...destInfo.rates]
              if (rates.length > 1) {
                rates.splice(index, 1)
                onChange({ rates })
              } else if (canDelete) {
                onDelete()
              }
            }}
            showDelete={canDelete ? true : rates.length > 1}
          />
        ))}
        {rates.length > 2 ? null : (
          <div>
            <button
              type="button"
              className="btn btn-link add-rate-link"
              onClick={() =>
                onChange({ rates: [...destInfo.rates, { amount: 0 }] })
              }
            >
              + <fbt desc="admin.settings.shipping.addRate">Add rate</fbt>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShippingDestination

require('react-styl')(`
  .shipping-destination
    .label 
      font-weight: bold
      font-size: 1rem
      margin-bottom: 0.5rem
    .rate-row, .rate-row .form-group
      margin-bottom: 0.5rem
    .add-rate-link
      margin-bottom: 1rem
      padding: 0
      

`)
