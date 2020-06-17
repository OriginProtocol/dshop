import React, { useReducer, useEffect } from 'react'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'

import UploadFile from './_UploadFile'
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

const ShopAppearance = () => {
  const { config } = useConfig()
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
        margin: 8px 0 0 15px
        > span
          visibility: hidden
`)
