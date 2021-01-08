import React, { useReducer, useEffect, useState } from 'react'
import fbt from 'fbt'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput } from 'utils/formHelpers'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import ManualTaxes from './_Taxes'
import taxInputValidation from './_taxInputValidation'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = ['cartSummaryNote', 'discountCodes', 'taxRates']

const CheckoutSettings = () => {
  const { config } = useConfig()
  const [, dispatch] = useStateValue()
  const { post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, {})
  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setState({
      ...pick(config, configFields)
    })
  }, [config])

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

        const { valid, newState } = taxInputValidation(state)

        if (!valid) {
          setSaving(false)
          setState(newState)
          return
        }

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
          dispatch({
            type: 'toast',
            message: (
              <fbt desc="admin.settings.checkout.savedMessage">
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
        <fbt desc="Checkout">Checkout</fbt>
        {actions}
      </h3>
      <div className="row">
        <div className="shop-settings col-md-8 col-lg-9">
          <div className="manual-taxes-wrapper">
            <ManualTaxes state={state} setState={setState} />
          </div>

          <div className="row mb-3">
            <div className="col-md-8">
              <div className="form-group">
                <label className="mb-0">
                  <fbt desc="admin.settings.checkout.cartSummaryNote">
                    Cart Summary Note
                  </fbt>
                </label>
                <div className="desc mb-3">
                  <fbt desc="admin.settings.checkout.cartSummaryNoteDesc">
                    Appears under summary in checkout process. Use it for any
                    information related to order fulfillment. Please see example
                    on the right.
                  </fbt>
                </div>
                <textarea {...input('cartSummaryNote')} rows="3" />
              </div>
            </div>
            <div className="col-md-4">
              <figure>
                <img
                  src="images/screenshot-note.png"
                  srcSet="images/screenshot-note.png,images/screenshot-note@2x.png 1.5x,images/screenshot-note@3x.png 2x"
                  className="sample-screenshot"
                />
                <figcaption>
                  <fbt desc="Example">Example</fbt>
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="form-group">
                <label className="mb-0">
                  <fbt desc="admin.settings.checkout.discountCodes">
                    Discount Codes
                  </fbt>
                </label>
                <div className="desc mb-3">
                  <fbt desc="admin.settings.checkout.discountCodeDesc">
                    Discount codes will appear in the summary section of the
                    checkout process. Please see example on the right.
                  </fbt>
                </div>
                <label className="form-check mb-3 font-weight-normal">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={state.discountCodes ? true : false}
                    onChange={(e) =>
                      setState({ discountCodes: e.target.checked })
                    }
                  />
                  <fbt desc="admin.settings.checkout.showDiscountCodesOnCheckout">
                    Show discount codes on checkout
                  </fbt>
                </label>
              </div>
            </div>
            <div className="col-md-4">
              <figure>
                <img
                  src="images/screenshot-discount.png"
                  srcSet="images/screenshot-discount.png,images/screenshot-discount@2x.png 1.5x,images/screenshot-discount@3x.png 2x"
                  className="sample-screenshot"
                />
                <figcaption>
                  <fbt desc="Example">Example</fbt>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default CheckoutSettings

require('react-styl')(`
  .sample-screenshot
    border-radius: 10px
    border: solid 1px #cdd7e0
    background-color: #ffffff
    padding: 10px
  .shop-settings
    figure
      max-width: 270px
      img
        width: 100%
    figcaption
      color: #8293a4
      text-align: center
      margin: 0.25rem 0 0.5rem 0
      font-size: 0.9rem
  .manual-taxes-wrapper
    border-bottom: solid 1px #cdd7e0
    padding-bottom: 2rem
    margin-bottom: 2rem
`)
