import React, { useReducer, useEffect, useState } from 'react'
import fbt from 'fbt'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'
import { AllCurrencies } from 'data/Currencies'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import PasswordField from 'components/admin/PasswordField'
import Domains from './domains/List'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = ['fullTitle', 'hostname', 'currency']

const GeneralSettings = () => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()
  const { shopConfig } = useShopConfig()
  const { post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, { domain: '' })
  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )
  const Feedback = formFeedback(state)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setState({
      ...pick(config, configFields),
      ...pick(shopConfig, ['hostname', 'emailSubject', 'supportEmail'])
    })
  }, [shopConfig, config])

  const actions = (
    <div className="actions">
      <button type="button" className="btn btn-outline-primary">
        <fbt desc="Cancel">Cancel</fbt>
      </button>
      <button
        type="submit"
        className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
        disabled={saving}
      >
        <fbt desc="Update">Update</fbt>
      </button>
    </div>
  )

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()

        if (saving) return

        setSaving(true)

        try {
          const shopConfig = pickBy(state, (v, k) => !k.endsWith('Error'))

          const shopConfigRes = await post('/shop/config', {
            method: 'PUT',
            body: JSON.stringify(shopConfig),
            suppressError: true
          })

          if (!shopConfigRes.success && shopConfigRes.field) {
            setState({ [`${shopConfigRes.field}Error`]: shopConfigRes.reason })
            setSaving(false)
            return
          }

          setState({ hasChanges: false })
          setSaving(false)
          dispatch({
            type: 'setConfigSimple',
            config: {
              ...config,
              ...pick(shopConfig, configFields)
            }
          })
          dispatch({ type: 'reload', target: 'shopConfig' })
          dispatch({
            type: 'toast',
            message: (
              <fbt desc="admin.settings.general.savedMessage">
                Settings saved
              </fbt>
            )
          })
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="General">General</fbt>
        {actions}
      </h3>
      <div className="row">
        <div className="shop-settings col-md-8 col-lg-9">
          <div className="form-group">
            <label>
              <fbt desc="admin.settings.general.storeName">Store Name</fbt>
            </label>
            <input {...input('fullTitle')} />
            {Feedback('fullTitle')}
          </div>

          <hr />

          <Domains {...{ config, state }} />

          <hr />

          <div className="row">
            <div className="form-group col-md-6">
              <label>
                <fbt desc="admin.settings.general.passwordProtect">
                  Password protect site
                </fbt>
              </label>
              <PasswordField field="password" input={input} />
              {Feedback('password')}
            </div>
          </div>

          <hr />

          <div className="row">
            <div className="form-group col-md-6">
              <label>
                <fbt desc="admin.settings.general.supportEmail">
                  Support email
                </fbt>
              </label>
              <input {...input('supportEmail')} />
              {Feedback('supportEmail')}
              <div className="desc">
                <fbt desc="admin.settings.general.supportEmailDesc">
                  Your customers will see this address when receiving emails
                  about their order.
                </fbt>
              </div>
            </div>
            <div className="form-group col-md-6">
              <label>
                <fbt desc="admin.settings.general.emailSubject">
                  Email subject
                </fbt>{' '}
                <span>
                  (
                  <fbt desc="admin.settings.general.forReceiptEmails">
                    for receipt emails
                  </fbt>
                  )
                </span>
              </label>
              <input {...input('emailSubject')} />
              {Feedback('emailSubject')}
            </div>
          </div>

          <hr />

          <div className="select-currency">
            <h4>
              <fbt desc="admin.settings.general.storeCurrency">
                Store currency
              </fbt>
            </h4>
            <div>
              <div className="description">
                <fbt desc="admin.settings.general.storeCurrencyDesc">
                  You should review any potential legal and tax considerations
                  involved with selling in a currency that is different from the
                  one associated with the country your store is located in.
                </fbt>
              </div>
              <select
                className="form-control"
                value={state.currency}
                onChange={(e) =>
                  setState({ hasChanges: true, currency: e.target.value })
                }
              >
                {AllCurrencies.map((currency) => (
                  <option key={currency[0]} value={currency[0]}>
                    {currency[1]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default GeneralSettings

require('react-styl')(`
  .shop-settings
    h4
      font-size: 18px
      font-weight: bold
    .upload-file
      max-width: 100%
    .add
      display: flex
      align-items: center
      svg
        margin-right: 5px
    input
      border: 1px solid #cdd7e0
      background-color: #fafbfc
    textarea
      border: 1px solid #cdd7e0
      background-color: #fafbfc
    label
      margin-top: 0.5rem
      > span
        font-size: 14px
        font-weight: normal
        color: #8293a4
        margin-left: 0.25rem
    a
      color: #3b80ee
      font-size: 14px
    .suffix-wrap
      position: relative
      .suffix
        pointer-events: none
        position: absolute
        top: 0
        color: #9faebd
        margin: 8px 0 0 15px
        > span
          visibility: hidden
    hr
      background-color: #cdd7e0
      margin: 1.5rem 0

  .select-currency
    margin-top: 1.5rem
    margin-bottom: 2rem
    line-height: normal
    > div
      color: #8293a4
      max-width: 530px
      .description
        font-size: 14px
        margin-bottom: 1rem

  .form-group .desc
    font-size: 14px
    font-weight: normal
    color: #8293a4
    margin-left: 0.25rem
    margin-top: 0.25rem
`)
