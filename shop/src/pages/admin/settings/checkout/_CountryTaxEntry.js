import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import { Countries, CountriesByCode } from '@origin/utils/Countries'
import { formInput, formFeedback } from 'utils/formHelpers'

const RateInput = ({ input, Feedback }) => {
  return (
    <div className="form-group">
      <div className="input-group">
        <input type="number" {...input('rate')} max="100" min="0" />
        <div className="input-group-append">
          <span className="input-group-text">%</span>
        </div>
      </div>
      {Feedback('rate')}
    </div>
  )
}

const ProvinceEntry = ({ country, entry, onChange, onRemove }) => {
  const input = formInput(entry, onChange)
  const Feedback = formFeedback(entry)

  const countryObj = CountriesByCode[country]
  const allProvinces = get(countryObj, 'provinces', {})

  return (
    <>
      <div className="form-group selectbox">
        <select 
          {...input('country')}
        >
          {Object.keys(allProvinces).map((province) => (
            <option key={province} value={allProvinces[province].code}>
              {province}
            </option>
          ))}
        </select>
        {Feedback('country')}
      </div>
      <RateInput input={input} Feedback={Feedback} />
    </>
  )
}

const CountryTaxEntry = ({ entry, onChange, onRemove }) => {
  const input = formInput(entry, onChange)
  const Feedback = formFeedback(entry)

  const provinces = get(entry, 'provinces', [{
    rate: 0
  }])

  const countryObj = CountriesByCode[entry.country]
  const allProvinces = get(countryObj, 'provinces', {})
  const hasProvinces = Boolean(Object.keys(allProvinces).length)

  return (
    <div className="country-tax-entry">

      <div className="form-group selectbox">
        <select 
          {...input('country')}
        >
          <option><fbt desc="admin.settings.checkout.taxes.selectCountry">Select country</fbt></option>
          {Object.keys(Countries).map((country) => (
            <option key={country} value={Countries[country].code}>
              {country}
            </option>
          ))}
        </select>
        {Feedback('country')}
      </div>

      {!entry.country ? <div className="flex-1 mx-auto" /> : (
        <>
          {hasProvinces ? 
            provinces.map((provinceEntry, index) => (
              <ProvinceEntry 
                key={index} 
                country={entry.country}
                entry={provinceEntry}
                onChange={newVal => {
                  const newState = [...provinces]
                  newState[index] = {
                    ...provinces[index],
                    ...newVal
                  }
                  onChange({
                    provinces: newState
                  })
                }} 
                onRemove={() => {
                  const newState = [...provinces]
                  newState.slice(index, 1)
                  onChange({
                    provinces: newState
                  })
                }}
              />
            ))
           : (
             <>
              <div className="selectbox" />
              <div>
                <RateInput input={input} Feedback={Feedback} />
              </div>
            </>
          )}
        </>
      )}


      <div className="delete-icon ml-auto" onClick={onRemove}>
        <img src="images/delete-icon.svg" />
      </div>

    </div>
  )
}

export default CountryTaxEntry

require('react-styl')(`
  .country-tax-entry
    display: flex
    align-items: center
    
    &:not(:last-child)
      margin-bottom: 1rem

    .form-group
      margin-bottom: 0

    .selectbox
      flex: 1
      margin-right: 1rem
      max-width: 320px

    .percent-input
      flex: 110px 0 0
      margin-right: 1rem

    .delete-icon
      cursor: pointer
      padding: 0 10px
`)
