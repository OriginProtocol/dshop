import React, { useReducer, useEffect, useState } from 'react'
import get from 'lodash/get'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import kebabCase from 'lodash/kebabCase'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'

import CustomDomain from './_CustomDomain'
import UploadFile from './_UploadFile'
import Tabs from './_Tabs'
import SocialLinks from './social-links/SocialLinks'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const socialLinkKeys = ['facebook', 'twitter', 'instagram', 'medium', 'youtube']

const ShopAppearance = () => {
  const { config } = useConfig()
  const { shopConfig } = useShopConfig()
  const { postRaw, post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, {
    domain: ''
  })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setState({
      title: get(config, 'fullTitle'),
      aboutStore: get(shopConfig, 'aboutStore'),
      domain: get(shopConfig, 'domain'),
      hostname: get(shopConfig, 'hostname'),
      logo: get(config, 'logo'),
      favicon: get(config, 'favicon'),
      byline: get(config, 'byline'),
      metaDescription: get(config, 'metaDescription'),
      cartSummaryNote: get(config, 'cartSummaryNote'),
      discountCodes: get(config, 'discountCodes'),
      emailSubject: get(config, 'emailSubject'),
      emailBody: get(config, 'emailBody'),
      css: get(config, 'css'),
      ...socialLinkKeys.reduce(
        (socialLinks, key) => ({ ...socialLinks, [key]: get(config, key, '') }),
        {}
      )
    })
  }, [shopConfig, config])

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()

        if (saving) return

        setSaving('saving')

        try {
          const shopConfig = pickBy(
            state,
            (v, k) => !k.endsWith('Error') && !socialLinkKeys.includes(k)
          )
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

          const hasChange = socialLinkKeys.some(
            (s) => get(state, s, '') !== get(config, s, '')
          )

          if (hasChange) {
            await post('/shop/social-links', {
              method: 'PUT',
              body: JSON.stringify(pick(state, socialLinkKeys))
            })
          }

          setSaving('ok')
          setTimeout(() => setSaving(null), 3000)
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title with-actions">
        Settings
        <div className="actions ml-auto">
          <button type="button" className="btn btn-outline-primary mr-2">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving === 'saving'
              ? 'Updating...'
              : saving === 'ok'
              ? 'Updated ✅'
              : 'Update'}
          </button>
        </div>
      </h3>
      <Tabs />
      <div className="row mt-4">
        <div className="shop-settings col-md-8 col-lg-9">
          <div className="form-group">
            <label>Store Name</label>
            <input
              {...input('title')}
              onChange={(e) => {
                const existing = kebabCase(state.title)
                const hostname = kebabCase(e.target.value)
                if (state.hostname === existing || !state.hostname) {
                  setState({ title: e.target.value, hostname })
                } else {
                  setState({ title: e.target.value })
                }
              }}
            />
            {Feedback('title')}
          </div>
          <div className="form-group">
            <label>Store Domain</label>
            <div className="suffix-wrap">
              <input {...input('hostname')} />
              <div className="suffix">
                <span>{state.hostname}</span>.ogn.app
              </div>
            </div>
            {Feedback('hostname')}
            <div className="mt-1 d-flex">
              <CustomDomain hostname={state.hostname} />
            </div>
          </div>
          <div className="form-group">
            <label>
              Tagline{' '}
              <span>(will appear nex to your logo on the masthead)</span>
            </label>
            <input {...input('byline')} />
          </div>
          <div className="form-group">
            <label>
              Store Logo
              <span>
                (max. size 200x200 px. 100x100 px recommended. PNG or JPG)
              </span>
            </label>
            {state.logo ? (
              <div className="mb-3">
                <img
                  src={`${config.backendAuthToken}/${state.logo}`}
                  style={{ maxWidth: '12rem', maxHeight: '3rem' }}
                />
              </div>
            ) : null}
            <UploadFile
              accept=".png, .jpeg, .svg"
              replace={state.logo ? true : false}
              onUpload={(body) => {
                body.append('type', 'logo')
                postRaw('/shop/assets', { method: 'PUT', body }).then((res) => {
                  setState({ logo: res.path })
                })
              }}
            />
          </div>
          <div className="form-group">
            <label>
              Store Favicon
              <span>
                (optimal image size 32x32 px in .ico format. Recommended favicon
                generator: www.favicon.com)
              </span>
            </label>
            {state.favicon ? (
              <div className="mb-3">
                <img
                  src={`${config.backendAuthToken}/${state.favicon}`}
                  style={{ maxWidth: 32 }}
                />
              </div>
            ) : null}
            <UploadFile
              accept=".png, .ico"
              replace={state.favicon ? true : false}
              onUpload={(body) => {
                body.append('type', 'favicon')
                postRaw('/shop/assets', { method: 'PUT', body }).then((res) => {
                  setState({ favicon: res.path })
                })
              }}
            />
          </div>
          <div className="form-group">
            <label>
              About your store
              <span>
                (visible on your About page to buyers browsing your store)
              </span>
            </label>
            <textarea style={{ minHeight: '20vh' }} {...input('aboutStore')} />
          </div>
          <div className="form-group">
            <label>
              Meta Description
              <span>(or SEO only. Will appear in HTML)</span>
            </label>
            <input {...input('metaDescription')} />
          </div>
          <div className="form-group">
            <label>
              Cart Summary Note
              <span>
                (appears under summary in checkout process. Use it for any
                information related to order fulfillment)
              </span>
            </label>
            <input {...input('cartSummaryNote')} />
          </div>
          <div>
            <label>Discount Codes</label>
            <span className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={state.discountCodes ? true : false}
                onChange={(e) => setState({ discountCodes: e.target.checked })}
              />
              Show discount codes on checkout
            </span>
          </div>
          <div className="form-group">
            <label>
              Email Subject <span>(for receipt emails)</span>
            </label>
            <input {...input('emailSubject')} />
          </div>
          <div className="form-group">
            <label>
              Email Body
              <span>(for receipt emails)</span>
            </label>
            <textarea style={{ minHeight: '15vh' }} {...input('emailBody')} />
          </div>
          <div className="form-group">
            <label>Custom CSS</label>
            <textarea style={{ minHeight: '15vh' }} {...input('css')} />
          </div>
        </div>

        <div className="col-lg-3 col-md-4">
          <SocialLinks socialLinks={state} setSocialLinks={setState} />
        </div>
      </div>
    </form>
  )
}

export default ShopAppearance

require('react-styl')(`
  .shop-settings
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
`)
