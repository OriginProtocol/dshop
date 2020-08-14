import React, { useState, useEffect } from 'react'
import { Countries, CountriesByCode } from '@origin/utils/Countries'
import fbt from 'fbt'
import Popover from 'components/Popover'

import Caret from 'components/icons/Caret'

const CountriesMultiSelect = ({
  selected,
  onChange,
  includeGlobalOption,
  className
}) => {
  const [shouldClose, setShouldClose] = useState(0)

  useEffect(() => {
    const listener = (e) => {
      if (
        !e.target.matches(
          '.countries-dropdown, .countries-dropdown *, .countries-multi-select, .countries-multi-select *'
        )
      ) {
        setShouldClose(shouldClose + 1)
      }
    }

    document.body.addEventListener('click', listener)
    return () => document.body.removeEventListener('click', listener)
  }, [shouldClose])

  const updateState = (value, checked) => {
    if (checked) {
      onChange(Array.from(new Set([...selected, value])))
    } else {
      onChange(selected.filter((c) => c !== value))
    }
  }

  return (
    <Popover
      el="div"
      className={`countries-multi-select form-control${
        className ? ` ${className}` : ''
      }`}
      placement="top-start"
      contentClassName="countries-dropdown"
      shouldClose={shouldClose}
      button={
        <>
          <div className="selection-label">
            {selected.length > 0 ? (
              selected.map((c) => CountriesByCode[c].name).join(', ')
            ) : includeGlobalOption ? (
              <fbt desc="admin.settings.shipping.restOfTheWorld">
                Rest of the world
              </fbt>
            ) : (
              <fbt desc="admin.settings.shipping.selectCountries">
                Select one or more
              </fbt>
            )}
          </div>
          <Caret />
        </>
      }
    >
      <>
        {!includeGlobalOption ? null : (
          <div className="form-check">
            <label className="form-check-label">
              <input
                type="checkbox"
                className="form-check-input"
                checked={selected.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Deselect all
                    onChange([])
                  }
                }}
              />
              <fbt desc="admin.settings.shipping.restOfTheWorld">
                Rest of the world
              </fbt>
            </label>
          </div>
        )}
        {Object.keys(Countries).map((country) => (
          <div className="form-check" key={country}>
            <label className="form-check-label">
              <input
                type="checkbox"
                className="form-check-input"
                checked={selected.includes(Countries[country].code)}
                onChange={(e) =>
                  updateState(Countries[country].code, e.target.checked)
                }
              />
              {`${country} (${Countries[country].code})`}
            </label>
          </div>
        ))}
      </>
    </Popover>
  )
}

export default CountriesMultiSelect

require('react-styl')(`
  .countries-multi-select
    cursor: pointer

    display: flex
    justify-content: space-between
    align-items: center

    .selection-label
      overflow: hidden
      text-overflow: ellipsis
      width: 100%
      white-space: nowrap

    &.invalid-feedback
      border: 1px solid #dc3545

  .countries-dropdown
    position: absolute
    color: #000
    z-index: 100
    box-shadow: 0 2px 11px 0 rgba(0, 0, 0, 0.2)
    border: solid 1px #cdd7e0
    background-color: #ffffff
    overflow: auto
    max-height: 300px
    padding: 10px
    
  .form-check-label 
    cursor: pointer
    
`)
