import React, { useReducer, useEffect } from 'react'

import pick from 'lodash/pick'

import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput } from 'utils/formHelpers'
import { useStateValue } from 'data/state'

import Tabs from './_Tabs'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = ['css', 'metaDescription', 'logErrors']

const AdvancedSettings = () => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()

  const { post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, { logErrors: false })

  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )
  // const Feedback = formFeedback(state)

  useEffect(() => {
    setState({
      ...pick(config, configFields)
    })
  }, [config])

  const submitForm = async (e) => {
    e.preventDefault()

    if (state.saving) return

    setState({
      saving: true
    })

    try {
      await post('/shop/config', {
        method: 'PUT',
        body: JSON.stringify(state)
      })
      dispatch({ type: 'toast', message: 'Your changes have been saved' })
      dispatch({
        type: 'setConfigSimple',
        config: {
          ...config,
          ...pick(state, configFields)
        }
      })
    } catch (err) {
      console.error(err)
      dispatch({
        type: 'toast',
        message: 'Failed to save your changes',
        style: 'error'
      })
    }

    setState({
      saving: false,
      hasChanges: false
    })
  }
  return (
    <form autoComplete="off" onSubmit={submitForm}>
      <h3 className="admin-title">
        Settings
        <div className="actions">
          <button type="button" className="btn btn-outline-primary">
            Cancel
          </button>
          <button
            type="submit"
            className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
            disabled={state.saving}
          >
            Update
          </button>
        </div>
      </h3>
      <Tabs />
      <div className="mt-4">
        <div className="shop-settings">
          <div className="form-group">
            <label>
              Meta Description
              <span>(for SEO only. Will appear in HTML)</span>
            </label>
            <input {...input('metaDescription')} />
          </div>

          <div className="form-group">
            <label>Custom CSS</label>
            <textarea style={{ minHeight: '15vh' }} {...input('css')} />
          </div>

          <label>Error Reporting</label>
          <div className="desc">
            Help us improve Origin Dshop’s stability and performance by sharing
            crash reports. If you do not want us to collect this data, you can
            opt out below.
          </div>
          <div className="form-check">
            <label className="form-check-label">
              <input
                type="checkbox"
                className="form-check-input"
                checked={state.logErrors}
                onChange={(e) =>
                  setState({ logErrors: e.target.checked, hasChanges: true })
                }
              />
              Send error reports to Origin
            </label>
          </div>
        </div>
      </div>
    </form>
  )
}

export default AdvancedSettings
