import React, { useReducer, useEffect, useState } from 'react'
import fbt from 'fbt'
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

import Link from 'components/Link'
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
  'css',
  'facebook',
  'twitter',
  'instagram',
  'medium',
  'youtube',
  'about',
  'hostname'
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
    setState({
      ...pick(config, configFields),
      ...pick(shopConfig, ['hostname', 'emailSubject', 'supportEmail'])
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
          <div className="form-group">
            <label>
              <fbt desc="admin.settings.general.storeDomain">Store Domain</fbt>
            </label>
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
              <fbt desc="admin.settings.general.tagline">Tagline</fbt>
              <span>
                (
                <fbt desc="admin.settings.general.taglineDesc">
                  will appear next to your logo on the masthead
                </fbt>
                )
              </span>
            </label>
            <input {...input('byline')} />
            {Feedback('byline')}
          </div>
          <div className="form-group">
            <label>
              <fbt desc="Logo">Logo</fbt>
              <span>
                (
                <fbt desc="admin.settings.general.logoDesc">
                  max. size 200x200 px. 100x100 px recommended. PNG or JPG
                </fbt>
                )
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
                <fbt desc="admin.settings.general.logoText">Logo text</fbt>
                <span>
                  (
                  <fbt desc="admin.settings.general.logoTextDesc">
                    will appear to right of your logo
                  </fbt>
                  )
                </span>
              </label>
              <input {...input('title')} />
              {Feedback('title')}
            </div>
          )}
          <div className="form-group">
            <label>
              <fbt desc="admin.settings.general.favicon">Favicon</fbt>
              <span>
                (
                <fbt desc="admin.settings.general.faviconDesc">
                  optimal image size 32x32 px in .ico format. Recommended
                  favicon generator: www.favicon.com
                </fbt>
                )
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
              <fbt desc="admin.settings.general.aboutStore">
                About your store
              </fbt>
              <span>
                (
                <fbt desc="admin.settings.general.aboutStoreDesc">
                  visible on your About page to buyers browsing your store
                </fbt>
                )
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
