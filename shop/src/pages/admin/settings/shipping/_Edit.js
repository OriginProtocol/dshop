import React, { useReducer } from 'react'

import get from 'lodash/get'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import camelCase from 'lodash/camelCase'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'
import Modal from 'components/Modal'
import ProcessingTimes from '@origin/utils/ProcessingTimes'
import CountriesMultiSelect from './_CountriesMultiSelect'

import { useStateValue } from 'data/state'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  id: '',
  label: '',
  countries: null,
  amount: 0,
  detail: '',
  processingTime: ''
}

const validate = (state) => {
  const newState = {}

  if (!state.label) {
    newState.labelError = 'Title is required'
  }

  if (!state.processingTime) {
    newState.processingTimeError = 'Select a processing time estimate'
  }

  if (Number.isNaN(state.amount)) {
    newState.amountError = 'Amount is required'
  }

  if (
    state.shipInternational &&
    (!state.countries || !state.countries.length)
  ) {
    newState.countriesError = 'Select at least one country'
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState,
      id: state.id || camelCase(state.label)
    }
  }
}

const EditShippingMethod = ({ onClose, shippingZone }) => {
  const [state, setState] = useReducer(reducer, {
    ...initialState,

    ...shippingZone,
    amount: shippingZone ? (shippingZone.amount / 100).toFixed() : 0,
    shipInternational: get(shippingZone, 'countries.length', 0) > 0,

    showModal: false,
    shouldClose: false
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const { post } = useBackendApi({ authToken: true })

  const [, dispatch] = useStateValue()

  const upsertShippingMethod = async () => {
    const { valid, newState } = validate(state)
    setState(newState)

    if (!valid) return

    setState({
      saving: true
    })

    try {
      await post(`/shipping-zones/${newState.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...pick(newState, Object.keys(initialState)),
          amount: parseInt(parseFloat(newState.amount) * 100),
          detail: `Arrives in ${newState.processingTime}`,
          countries: newState.shipInternational ? newState.countries : null
        })
      })
      dispatch({ type: 'reload', target: ['shippingZones'] })
      setState({
        shouldClose: true
      })
    } catch (err) {
      console.error(err)
      setState({
        saving: false
      })
    }
  }

  return (
    <Modal
      shouldClose={state.shouldClose}
      onClose={() => {
        setState({
          showModal: false,
          shouldClose: false
        })
        onClose()
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          upsertShippingMethod()
        }}
      >
        <div className="modal-body payment-method-modal">
          <h5>Add Shipping Method</h5>

          <div className="form-group">
            <label>Title</label>
            <input {...input('label')} />
            {Feedback('label')}
          </div>

          <div className="form-group">
            <label>Cost per shipment</label>
            <input {...input('amount')} type="number" min="0" />
            {Feedback('amount')}
          </div>

          <div className="form-group">
            <label>Processing Time</label>
            <select {...input('processingTime')}>
              <option>Please choose one...</option>
              {ProcessingTimes.filter((t) => t.value !== 'custom').map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {Feedback('processingTime')}
          </div>

          <div className="form-check my-3">
            <label className="form-check-label">
              <input
                checked={state.shipInternational ? true : false}
                onChange={(e) =>
                  setState({ shipInternational: e.target.checked })
                }
                type="checkbox"
                className="form-check-input"
              />
              Products ship internationally
            </label>
          </div>

          {!state.shipInternational ? null : (
            <div className="form-group">
              <label>Ships to</label>
              <CountriesMultiSelect
                selected={state.countries || []}
                onChange={(countries) => {
                  setState({ countries })
                }}
              />
              {Feedback('countries')}
            </div>
          )}

          <div className="actions">
            <button
              className="btn btn-outline-primary mr-2"
              type="button"
              onClick={() => {
                setState({
                  shouldClose: true
                })
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={state.saving}
            >
              {state.saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default EditShippingMethod

require('react-styl')(`
`)
