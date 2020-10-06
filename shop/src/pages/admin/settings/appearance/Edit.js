import React, { useReducer, useEffect, useState } from 'react'
import fbt from 'fbt'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import CKEditor from 'ckeditor4-react'

import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import UploadFile from './_UploadFile'
import SocialLinks from './social-links/SocialLinks'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = [
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
  'themeId'
]

const ABOUT_FILENAME = 'about.html'

const AppearanceSettings = () => {
  const { config } = useConfig()
  const [{ admin }, dispatch] = useStateValue()
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
      ...pick(config, configFields)
    })
  }, [config])

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
              <fbt desc="admin.settings.appearance.savedMessage">
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
        <fbt desc="Appearance">Appearance</fbt>
        {actions}
      </h3>
      <div className="row">
        <div className="shop-settings col-md-8 col-lg-9">
          <div className="form-group">
            <label>
              <fbt desc="admin.settings.appearance.tagline">Tagline</fbt>
              <span>
                (
                <fbt desc="admin.settings.appearance.taglineDesc">
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
                <fbt desc="admin.settings.appearance.logoDesc">
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
                <fbt desc="admin.settings.appearance.logoText">Logo text</fbt>
                <span>
                  (
                  <fbt desc="admin.settings.appearance.logoTextDesc">
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
              <fbt desc="admin.settings.appearance.favicon">Favicon</fbt>
              <span>
                (
                <fbt desc="admin.settings.appearance.faviconDesc">
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
              <fbt desc="admin.settings.appearance.aboutStore">
                About your store
              </fbt>
              <span>
                (
                <fbt desc="admin.settings.appearance.aboutStoreDesc">
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
          {!admin.superuser ? null : (
            <div className="select-currency">
              <h4>Theme</h4>
              <div>
                <select
                  className="form-control"
                  value={state.themeId}
                  onChange={(e) =>
                    setState({ hasChanges: true, themeId: e.target.value })
                  }
                >
                  <option value="">Default</option>
                  <option value="art">Art</option>
                  <option value="poly">Poly</option>
                  <option value="ybm">YBM</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-3 col-md-4">
          <SocialLinks socialLinks={state} setSocialLinks={setState} />
        </div>
      </div>
      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default AppearanceSettings
