import React, { useEffect } from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import { Countries, CountriesByCode } from '@origin/utils/Countries'
import { formInput, formFeedback } from 'utils/formHelpers'
import PlusIcon from 'components/icons/Plus'

const RateInput = ({ input, Feedback }) => {
  return (
    <div className="form-group">
      <div className="input-group">
        <input
          type="number"
          {...input('rate', false, true)}
          max="100"
          min="0"
        />
        <div className="input-group-append">
          <span className="input-group-text">%</span>
        </div>
      </div>
      {Feedback('rate')}
    </div>
  )
}

const RowItem = ({
  countrySelectbox,
  provinceSelectbox,
  rateInput,
  onRemove
}) => {
  return (
    <div className="country-province-row">
      <div className="form-group selectbox">{countrySelectbox}</div>
      <div className="form-group selectbox">{provinceSelectbox}</div>
      <div>{rateInput}</div>
      {!onRemove ? null : (
        <div className="delete-icon ml-auto" onClick={onRemove}>
          <img src="images/delete-icon.svg" />
        </div>
      )}
    </div>
  )
}

const ProvinceEntry = ({
  country,
  entry,
  onChange,
  onRemove,
  countrySelectbox
}) => {
  const input = formInput(entry, onChange)
  const Feedback = formFeedback(entry)

  const countryObj = CountriesByCode[country]
  const allProvinces = get(countryObj, 'provinces', {})

  return (
    <RowItem
      countrySelectbox={countrySelectbox}
      onRemove={onRemove}
      provinceSelectbox={
        <>
          <select {...input('province')}>
            <option>Select one</option>
            {Object.keys(allProvinces).map((province) => (
              <option key={province} value={allProvinces[province].code}>
                {province}
              </option>
            ))}
          </select>
          {Feedback('province')}
        </>
      }
      rateInput={<RateInput input={input} Feedback={Feedback} />}
    />
  )
}

const CountryTaxEntry = ({ entry, onChange, onRemove }) => {
  const input = formInput(entry, onChange)
  const Feedback = formFeedback(entry)

  const provinces = get(entry, 'provinces')

  const countryObj = CountriesByCode[entry.country]
  const allProvinces = get(countryObj, 'provinces', {})
  const hasProvinces = Boolean(Object.keys(allProvinces).length)

  const countrySelectbox = (
    <>
      <select {...input('country')}>
        <option>
          <fbt desc="admin.settings.checkout.taxes.selectCountry">
            Select country
          </fbt>
        </option>
        {Object.keys(Countries).map((country) => (
          <option key={country} value={Countries[country].code}>
            {country}
          </option>
        ))}
      </select>
      {Feedback('country')}
    </>
  )

  useEffect(() => {
    if (!provinces || !provinces.length) {
      onChange({
        provinces: [{}]
      })
    }
  }, [provinces])

  return (
    <div className="country-tax-entry">
      {!entry.country || !hasProvinces ? (
        <RowItem
          countrySelectbox={countrySelectbox}
          rateInput={
            !entry.country ? null : (
              <RateInput input={input} Feedback={Feedback} />
            )
          }
          onRemove={onRemove}
        />
      ) : (
        <>
          {(provinces || []).map((provinceEntry, index) => {
            return (
              <ProvinceEntry
                key={index}
                country={entry.country}
                countrySelectbox={index === 0 ? countrySelectbox : null}
                entry={provinceEntry}
                onChange={(newVal) => {
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
                  newState.splice(index, 1)
                  if (!newState.length) {
                    onRemove()
                  } else {
                    onChange({
                      provinces: newState
                    })
                  }
                }}
              />
            )
          })}
          <RowItem
            provinceSelectbox={
              <div
                className="add-more-button"
                onClick={() => {
                  onChange({
                    provinces: [...provinces, {}]
                  })
                }}
              >
                <PlusIcon />{' '}
                <fbt desc="admin.settings.checkout.addAnotherState">
                  Add another state
                </fbt>
              </div>
            }
          />
        </>
      )}
    </div>
  )
}

export default CountryTaxEntry

require('react-styl')(`
  .country-tax-entry
    .country-province-row
      display: flex
      margin-bottom: 1rem
    
    &:not(:last-child)
      border-bottom: 1px solid #e3ebf2
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
      padding: 7px 10px

    .add-more-button
      cursor: pointer
      color: #0056b3
      padding: 0.75rem 0.5rem
      display: flex
      align-items: center

      svg
        margin-right: 8px

`)
