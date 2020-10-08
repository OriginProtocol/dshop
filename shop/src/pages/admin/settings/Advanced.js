import React, { useReducer, useEffect } from 'react'
import fbt from 'fbt'
import pick from 'lodash/pick'

import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput } from 'utils/formHelpers'
import { useStateValue } from 'data/state'
import Link from 'components/Link'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = ['css', 'metaDescription', 'logErrors', 'gaCode']

const AdvancedSettings = () => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()

  const { post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, { logErrors: true })

  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )

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
      dispatch({
        type: 'toast',
        message: fbt(
          'Your changes have been saved',
          'admin.settings.advanced.changesSaved'
        )
      })
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
        message: fbt(
          'Failed to save your changes',
          'admin.settings.advanced.saveError'
        ),
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
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        Advanced
        <div className="actions">
          <button type="button" className="btn btn-outline-primary">
            <fbt desc="Cancel">Cancel</fbt>
          </button>
          <button
            type="submit"
            className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
            disabled={state.saving}
          >
            <fbt desc="Update">Update</fbt>
          </button>
        </div>
      </h3>
      <div className="mt-4">
        <div className="shop-settings">
          <div className="form-group">
            <label>
              <fbt desc="admin.settings.advanced.metaDesc">
                Meta Description
              </fbt>
              <span>
                (
                <fbt desc="admin.settings.advanced.metaDescHint">
                  for SEO only. Will appear in HTML
                </fbt>
                )
              </span>
            </label>
            <input {...input('metaDescription')} />
          </div>

          <div className="form-group">
            <label>
              <fbt desc="admin.settings.advanced.customCSS">Custom CSS</fbt>
            </label>
            <textarea style={{ minHeight: '15vh' }} {...input('css')} />
          </div>

          <label>
            <fbt desc="admin.settings.advanced.errorReporting">
              Error Reporting
            </fbt>
          </label>
          <div className="desc">
            <fbt desc="admin.settings.advanced.errorReportingDesc">
              Help us improve Origin Dshop’s stability and performance by
              sharing crash reports. If you do not want us to collect this data,
              you can opt out below.
            </fbt>
          </div>
          <div className="form-check mb-3">
            <label className="form-check-label">
              <input
                type="checkbox"
                className="form-check-input"
                checked={state.logErrors}
                onChange={(e) =>
                  setState({ logErrors: e.target.checked, hasChanges: true })
                }
              />
              <fbt desc="admin.settings.advanced.sendErrors">
                Send error reports to Origin
              </fbt>
            </label>
          </div>

          <div className="form-group">
            <label className="mb-0">
              <fbt desc="admin.settings.advanced.googleAnalytics">
                Google Analytics
              </fbt>
            </label>
            <div className="desc mb-3 mx-0">
              <fbt desc="admin.settings.advanced.gaDesc">
                Track visitors to your store and generate reports that will help
                you with your marketing.
              </fbt>
            </div>

            <input {...input('gaCode')} />
          </div>
        </div>
      </div>
    </form>
  )
}

export default AdvancedSettings
