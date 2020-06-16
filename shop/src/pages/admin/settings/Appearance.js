import React, { useReducer, useEffect, useRef } from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'

import Tabs from './_Tabs'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const PlusIcon = () => (
  <svg width="12" height="12">
    <line x1="0" x2="12" y1="6" y2="6" stroke="#3b80ee" strokeWidth="2" />
    <line x1="6" x2="6" y1="0" y2="12" stroke="#3b80ee" strokeWidth="2" />
  </svg>
)

const UploadIcon = () => (
  <svg width="38" height="47" viewBox="0 0 38 47">
    <path
      fill="#3B80EE"
      d="M27.162 35.863V19.291H38L19 0 0 19.29h10.838v16.573h16.324zM38 47v-5.568H0V47h38z"
    />
  </svg>
)

const ShopAppearance = () => {
  const { config } = useConfig()
  const logoRef = useRef()
  const faviconRef = useRef()
  const { shopConfig } = useShopConfig()
  const { postRaw } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, {
    domain: ''
  })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  useEffect(() => {
    setState({
      title: get(config, 'fullTitle'),
      domain: get(shopConfig, 'domain'),
      logo: get(config, 'logo'),
      favicon: get(config, 'favicon')
    })
  }, [shopConfig, config])

  return (
    <>
      <h3 className="admin-title with-actions">
        Settings
        <div className="actions ml-auto">
          <button type="submit" className="btn btn-outline-primary mr-2">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Update
          </button>
        </div>
      </h3>
      <Tabs />
      <form className="mt-4 shop-settings">
        <div className="form-group">
          <label>Store Name</label>
          <input {...input('title')} />
          {Feedback('title')}
        </div>
        <div className="form-group">
          <label>Store Domain</label>
          <div className="suffix-wrap">
            <div className="suffix">
              <span>{state.hostname}</span>.ogn.app
            </div>
            <input {...input('hostname')} />
          </div>
          {Feedback('hostname')}
          <div className="mt-1">
            <a onClick={(e) => e.preventDefault()} href="#" className="add">
              <PlusIcon />
              Add a custom domain
            </a>
          </div>
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
          <div className="upload-image">
            <UploadIcon />
            <input
              type="file"
              ref={logoRef}
              className="form-control d-none"
              accept=".png, .jpeg, .svg"
              onChange={(e) => {
                setState({ assets: e.target.files })
                const body = new FormData()
                body.append('type', 'logo')
                for (const file of e.target.files) {
                  body.append('file', file)
                }

                postRaw('/shop/assets', { method: 'PUT', body }).then((res) => {
                  setState({ logo: res.path })
                })
              }}
            />
            <button
              type="button"
              className="btn btn-outline-primary btn-rounded px-4"
              onClick={() => logoRef.current.click()}
            >
              {`${state.logo ? 'Replace' : 'Add'} Image`}
            </button>
          </div>
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
          <div className="upload-image">
            <UploadIcon />
            <input
              type="file"
              ref={faviconRef}
              className="form-control d-none"
              accept=".png, .ico"
              onChange={(e) => {
                setState({ assets: e.target.files })
                const body = new FormData()
                body.append('type', 'favicon')
                for (const file of e.target.files) {
                  body.append('file', file)
                }

                postRaw('/shop/assets', { method: 'PUT', body }).then((res) => {
                  setState({ favicon: res.path })
                })
              }}
            />
            <button
              type="button"
              className="btn btn-outline-primary btn-rounded px-4"
              onClick={() => faviconRef.current.click()}
            >
              {`${state.favicon ? 'Replace' : 'Add'} Image`}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>
            About your store
            <span>
              (visible on your About page to buyers browsing your store)
            </span>
          </label>
          <textarea className="form-control" style={{ minHeight: '20vh' }} />
        </div>
      </form>
    </>
  )
}

export default ShopAppearance

require('react-styl')(`
  .shop-settings
    .add
      display: flex
      align-items: center
      svg
        margin-right: 5px
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
      input.form-control
        background-color: transparent
      .suffix
        position: absolute
        color: #9faebd
        margin: 7px 0 0 15px
        > span
          visibility: hidden
  .upload-image
    border: 1px dashed #3b80ee
    background-color: #f8fbff
    flex-direction: column
    height: 175px
    display: flex
    align-items: center
    justify-content: center
    border-radius: 5px
    max-width: 650px
    svg
      margin-bottom: 1.5rem
`)
