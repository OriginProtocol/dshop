import React, { useReducer, useEffect, useState } from 'react'
import get from 'lodash/get'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import kebabCase from 'lodash/kebabCase'

import CKEditor from 'ckeditor4-react'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'
import { useStateValue } from 'data/state'
import parsePlainEmail from 'utils/parsePlainEmail'

import Tabs from '../_Tabs'
import CustomDomain from './_CustomDomain'
import UploadFile from './_UploadFile'
import SocialLinks from './social-links/SocialLinks'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = [
  'fullTitle',
  'title',
  'logo',
  'favicon',
  'byline',
  'metaDescription',
  'cartSummaryNote',
  'discountCodes',
  'emailSubject',
  'emailBody',
  'css',
  'facebook',
  'twitter',
  'instagram',
  'medium',
  'youtube',
  'about',
  'hostname',
  'supportEmail'
]

const ABOUT_FILENAME = 'about.html'

const GeneralSettings = () => {
  const { config } = useConfig()
  const [{ admin }, dispatch] = useStateValue()
  const { shopConfig } = useShopConfig()
  const { postRaw, post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, { domain: '' })
  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )
  const Feedback = formFeedback(state)

  const [saving, setSaving] = useState(false)

  const [aboutText, setAboutText] = useState('')

  useEffect(() => {
    let storeEmail = get(shopConfig, 'storeEmail', get(shopConfig, 'fromEmail'))
    storeEmail = parsePlainEmail(storeEmail)

    const supportEmail = parsePlainEmail(get(config, 'supportEmail'))

    setState({
      hostname: get(shopConfig, 'hostname'),
      ...pick(config, configFields),
      supportEmail,
      storeEmail
    })
  }, [shopConfig, config])

  useEffect(() => {
    let timeout
    if (config.about) {
      fetch(`${config.dataSrc}${config.about}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.text()
        })
        // NOTE: CKEditor takes a few seconds to load
        .then((body) => (timeout = setTimeout(() => setAboutText(body), 2000)))
        .catch((err) => {
          console.error('Failed to load about page', err)
        })
    }

    return () => clearTimeout(timeout)
  }, [config && config.about])

  const actions = (
    <div className="actions">
      <button type="button" className="btn btn-outline-primary">
        Cancel
      </button>
      <button
        type="submit"
        className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
        disabled={saving}
      >
        Update
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

          // About file data
          shopConfig.about = ABOUT_FILENAME
          shopConfig.aboutText = aboutText || ''

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
          dispatch({ type: 'toast', message: 'Settings saved' })
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title">
        Settings
        {actions}
      </h3>
      <Tabs />
      <div className="row mt-4">
        <div className="shop-settings col-md-8 col-lg-9">
          <div className="form-group">
            <label>Store Name</label>
            <input {...input('fullTitle')} />
            {Feedback('fullTitle')}
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label>Store contact email</label>
                <input {...input('storeEmail')} />
                {Feedback('storeEmail')}
                <div className="desc">
                  We&apos;ll use this address if we need to contact you about
                  your store.
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label>Customer email</label>
                <input {...input('supportEmail')} />
                {Feedback('supportEmail')}
                <div className="desc">
                  Your customers will see this address when receiving emails
                  about their order.
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Store Domain</label>
            <div className="suffix-wrap">
              <input
                {...input('hostname')}
                onChange={(e) =>
                  setState({
                    hostname: kebabCase(e.target.value),
                    hostnameError: null
                  })
                }
              />
              <div className="suffix">
                <span>{state.hostname}</span>
                {`.${get(admin, 'network.domain')}`}
              </div>
            </div>
            {Feedback('hostname')}
            <div className="mt-1 d-flex">
              <CustomDomain hostname={state.hostname} netId={config.netId} />
            </div>
          </div>
          <div className="form-group">
            <label>
              Tagline
              <span>(will appear next to your logo on the masthead)</span>
            </label>
            <input {...input('byline')} />
            {Feedback('byline')}
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
                  const logo = res.path
                  const newState = { logo }
                  if (!config.logo) {
                    newState.title = ''
                  }
                  setState(newState)
                  dispatch({
                    type: 'setConfigSimple',
                    config: { ...config, logo }
                  })
                })
              }}
            />
          </div>
          {!state.logo ? null : (
            <div className="form-group">
              <label>
                Logo text
                <span>(will appear to right of your logo)</span>
              </label>
              <input {...input('title')} />
              {Feedback('title')}
            </div>
          )}
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
                  const favicon = res.path
                  setState({ favicon })
                  dispatch({
                    type: 'setConfigSimple',
                    config: { ...config, favicon }
                  })
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
            {/* <textarea style={{ minHeight: '20vh' }} {...input('about')} /> */}
            <CKEditor
              data={aboutText}
              config={{
                toolbar: [
                  { name: 'styles', items: ['Format'] },
                  {
                    name: 'basicstyles',
                    items: ['Bold', 'Italic', '-', 'RemoveFormat']
                  },
                  {
                    name: 'paragraph',
                    items: [
                      'NumberedList',
                      'BulletedList',
                      '-',
                      'Outdent',
                      'Indent'
                    ]
                  },
                  { name: 'links', items: ['Link', 'Unlink'] },
                  {
                    name: 'insert',
                    items: ['Image', 'Table', 'HorizontalRule']
                  }
                ]
              }}
              onChange={(e) => setAboutText(e.editor.getData())}
            />
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
          {/* <div className="form-group">
            <label>
              Email Body
              <span>(for receipt emails)</span>
            </label>
            <textarea style={{ minHeight: '15vh' }} {...input('emailBody')} />
          </div> */}
        </div>

        <div className="col-lg-3 col-md-4">
          <SocialLinks socialLinks={state} setSocialLinks={setState} />
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

  .form-group .desc
    font-size: 14px
    font-weight: normal
    color: #8293a4
    margin-left: 0.25rem
    margin-top: 0.25rem
`)
