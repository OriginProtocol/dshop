import React, { useState, useReducer, useEffect } from 'react'

import pick from 'lodash/pick'

import ProcessingTimes from '@origin/utils/ProcessingTimes'
import { Countries } from 'data/Countries'

import useConfig from 'utils/useConfig'
import useShippingZones from 'utils/useShippingZones'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'

import Tabs from '../_Tabs'
import ShippingDestination from './_ShippingDestination'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  destinations: [],
  hasChanges: false
}

const newDestState = {
  countries: [],
  label: '',
  processingTime: '',
  detail: '',
  amount: 0,
  rates: [
    {
      processingTime: '',
      amount: 0
    }
  ]
}

/**
 * Adds sourceCountry to `destinations` array, if it doesn't exist.
 * Moves it to top, if it already exists
 *
 * @param {Array<Object>} destinations shippingZones from shipping.json file
 * @param {String} sourceCountry `shippingFrom` field from config.json file
 *
 * @returns {Array<Object>} shippingZones with `sourceCountry` entry at the top
 */
const addSourceCountry = (destinations, sourceCountry) => {
  const out = [...destinations]
  const sourceIndex = out.findIndex(({ countries }) => {
    if (!countries) return false
    return countries.length === 1 && countries[0] === sourceCountry
  })

  if (sourceIndex === 0) {
    // sourceCountry exists and is already at the top
    return out
  } else if (sourceIndex > 0) {
    // sourceCountry exists but is not at the top
    // Move it to the top and then return
    const [entry] = out.splice(sourceIndex, 1)
    out.unshift(entry)
  } else if (sourceIndex < 0) {
    // sourceCountry entry doesn't exist
    // Add it to the top
    out.unshift({
      ...newDestState,
      countries: [sourceCountry]
    })
  }

  return out
}

const Shipping = () => {
  const { shippingZones, loading } = useShippingZones()
  const { config } = useConfig()
  const [state, setState] = useReducer(reducer, initialState)

  const { post } = useBackendApi({ authToken: true })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  useEffect(() => {
    if (loading || state.loaded) return

    const newState = {
      loaded: true,

      shippingFrom: 'US',
      ...pick(config, ['shippingFrom', 'processingTime'])
    }

    newState.destinations = addSourceCountry(
      shippingZones,
      newState.shippingFrom
    )

    setState(newState)
  }, [loading, shippingZones, config, state.loaded])

  useEffect(() => {
    if (!state.loaded) return

    let destinations = [...state.destinations].filter(
      ({ countries }, index) => {
        if (index == 0 || !countries || countries.length > 1) return true

        return countries[0] === state.shippingFrom
      }
    )

    destinations[0].countries = [state.shippingFrom]

    setState({
      destinations
    })
  }, [state.shippingFrom, state.loaded])

  return (
    <form>
      <div className="shipping-settings">
        <h3 className="admin-title">
          Settings
          <div className="actions">
            <button type="button" className="btn btn-outline-primary">
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn${state.hasChanges ? '' : '-outline'}-primary`}
            >
              Update
            </button>
          </div>
        </h3>
        <Tabs />
        {loading ? (
          'Loading...'
        ) : (
          <>
            <div className="row my-4 common-opts">
              <div className="col-md-4">
                <div className="form-group">
                  <label className="mb-0">Shipping from</label>
                  <div className="desc">The country you’re shipping from</div>
                  <select {...input('shippingFrom')}>
                    {Object.keys(Countries).map((country) => (
                      <option key={country} value={Countries[country].code}>
                        {country}
                      </option>
                    ))}
                  </select>
                  {Feedback('shippingFrom')}
                </div>

                <div className="form-group">
                  <label className="mb-0">Processing time</label>
                  <div className="desc">
                    Once purchased, how long does it take you to ship an item?
                  </div>
                  <select {...input('processingTime')}>
                    {ProcessingTimes.filter((t) => t.value !== 'custom').map(
                      (time) => (
                        <option key={time.value} value={time.value}>
                          {time.label}
                        </option>
                      )
                    )}
                  </select>
                  {Feedback('processingTime')}
                  <div className="desc dark mt-2">
                    Buyers are more likely to purchase an item that is
                    dispatched quickly
                  </div>
                </div>
              </div>
            </div>

            <div className="common-opts">
              <div className="form-group">
                <label>Shipping to</label>
                <div className="desc">
                  Only shoppers in countries you deliver to will see your
                  listings
                </div>
              </div>

              <div className="shipping-destinations">
                {state.destinations.map((dest, index) => {
                  return (
                    <ShippingDestination
                      key={index}
                      destInfo={dest}
                      disableCountrySelectbox={index === 0}
                      onChange={(updatedVal) => {
                        const destinations = [...state.destinations]
                        destinations[index] = {
                          ...destinations[index],
                          ...updatedVal
                        }
                        setState({ destinations })
                      }}
                      onDelete={() => {
                        const destinations = [...state.destinations]
                        destinations.splice(index, 1)
                        setState({ destinations })
                      }}
                      canDelete={index > 0}
                    />
                  )
                })}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() =>
                  setState({
                    destinations: [...state.destinations, { ...newDestState }]
                  })
                }
              >
                + Add another location
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  )
}

export default Shipping

require('react-styl')(`
  .shipping-settings
    .form-group 
      label ~ .desc
        margin: 0
        margin-bottom: 0.5rem
        &.dark
          color: #000

    .common-opts
      border-bottom: 1px solid #dfe2e6
      margin-bottom: 1rem
      padding-bottom: 1rem
`)
