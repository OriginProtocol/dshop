import React, { useState, useEffect } from 'react'
import get from 'lodash/get'
import kebabCase from 'lodash/kebabCase'

import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import useSetState from 'utils/useSetState'
import CreateListing from './CreateListing'
import { formInput, formFeedback } from 'utils/formHelpers'
import PasswordField from 'components/admin/PasswordField'

import ShopReady from './ShopReady'
import FetchShopConfig from './_FetchShopConfig'

async function genPGP() {
  const randomArray = Array.from(crypto.getRandomValues(new Uint32Array(5)))
  const pgpPrivateKeyPass = randomArray.map((n) => n.toString(36)).join('')

  const key = await openpgp.generateKey({
    userIds: [{ name: 'D-Shop', email: `dshop@example.com` }],
    curve: 'ed25519',
    passphrase: pgpPrivateKeyPass
  })
  const pgpPublicKey = key.publicKeyArmored.replace(/\\r/g, '')
  const pgpPrivateKey = key.privateKeyArmored.replace(/\\r/g, '')
  return { pgpPrivateKeyPass, pgpPublicKey, pgpPrivateKey }
}

function validate(state) {
  const newState = {}

  if (state.shopType !== 'local-dir') {
    if (!state.name) {
      newState.nameError = 'Enter a Shop Name'
    }
    if (!state.hostname) {
      newState.hostnameError = 'Enter a hostname'
    } else if (!state.hostname.match(/^[a-zA-Z0-9-]+$/)) {
      newState.hostnameError = 'Invalid hostname'
    }
  }

  if (!state.dataDir) {
    newState.dataDirError = 'Enter a Data Dir'
  } else if (!state.dataDir.match(/^[a-z0-9-]+$/)) {
    newState.dataDirError = 'Use alpha-numeric characters only'
  }
  if (!state.backend) {
    newState.backendError = 'Enter a URL'
  }
  if (state.shopType === 'printful' && !state.printfulApi) {
    newState.printfulApiError = 'Enter an API key'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const CreateShop = () => {
  const { config } = useConfig()
  const [{ admin }] = useStateValue()
  const [advanced, setAdvanced] = useState(false)
  const [ready, setReady] = useState()
  const [loading, setLoading] = useState(false)
  const localShops = get(admin, 'localShops', [])
  const [state, setState] = useSetState({
    listingId: '',
    name: '',
    backend: get(window, 'location.origin'),
    dataDir: localShops.length ? localShops[0] : 'data',
    hostname: '',
    printfulApi: '',
    pgpPublicKey: '',
    pgpPrivateKey: '',
    pgpPrivateKeyPass: '',
    web3Pk: '',
    shopType: localShops.length ? 'local-dir' : 'multi-product'
  })
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)
  useEffect(() => {
    genPGP().then((pgpKeys) => setState(pgpKeys))
  }, [])
  useEffect(() => {
    const hostname = kebabCase(state.name)
    setState({ hostname, dataDir: hostname })
  }, [state.name])

  if (!admin) {
    return
  }
  if (ready) {
    return <ShopReady {...ready} />
  }

  const netId = get(admin, 'network.networkId')
  const listingPrefix = `${netId}-${get(admin, 'network.marketplaceVersion')}-`

  return (
    <form
      className="create-shop"
      onSubmit={async (e) => {
        e.preventDefault()

        const { valid, newState } = validate(state)
        setState(newState)

        if (!valid) {
          window.scrollTo(0, 0)
          return
        }

        setLoading(true)
        const res = await fetch(`${config.backend}/shop`, {
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          method: 'POST',
          body: JSON.stringify({
            ...state,
            listingId: state.listingId
              ? `${listingPrefix}${state.listingId}`
              : ''
          })
        })
        const json = await res.json()
        setLoading(false)
        if (!json.success) {
          if (json.reason === 'invalid') {
            setState({ [`${json.field}Error`]: json.message })
            window.scrollTo(0, 0)
          }
        } else {
          setReady(json)
        }
      }}
    >
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Shop type</label>
          <select {...input('shopType')}>
            <option value="multi-product">New Multi Product</option>
            <option value="single-product">New Single Product</option>
            <option value="blank">DB Entry Only</option>
            {localShops.length ? (
              <option value="local-dir">From Cache</option>
            ) : null}
            <option value="clone-url">Clone URL</option>
            {/* <option value="clone-ipfs">Clone IPFS Hash</option> */}
            <option value="printful">New Printful</option>
            <option value="affiliate">New Affiliate</option>
          </select>
        </div>
        {state.shopType === 'local-dir' ? (
          <div className="form-group col-md-6">
            <label>Data dir</label>
            <select {...input('dataDir')}>
              {localShops.map((localShop) => (
                <option key={localShop}>{localShop}</option>
              ))}
            </select>
          </div>
        ) : state.shopType === 'clone-url' ? (
          <div className="form-group col-md-6">
            <label>URL</label>
            <div className="input-group">
              <input
                {...input('cloneUrl')}
                placeholder="eg https://originswag.eth.link"
              />
              <div className="input-group-append">
                <FetchShopConfig
                  onSuccess={(hash) => console.log(hash)}
                  className="btn btn-outline-primary"
                  url={state.cloneUrl}
                  children="Go"
                />
              </div>
            </div>
            {Feedback('cloneUrl')}
          </div>
        ) : (
          <div className="form-group col-md-6">
            <label>Shop Name</label>
            <input {...input('name')} placeholder="eg My Store" autoFocus />
            {Feedback('name')}
          </div>
        )}
      </div>
      <div className="form-group">
        <label>Existing Listing ID</label>
        <div className="d-flex">
          <div style={{ flex: 1 }}>
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text">{listingPrefix}</span>
              </div>
              <input {...input('listingId')} />
            </div>
            {Feedback('listingId')}
          </div>
          <div className="mx-3 pt-1">or</div>
          <div style={{ flex: 1 }}>
            <CreateListing
              className="btn btn-outline-primary w-100"
              onCreated={(listingId) => {
                setState({ listingId: String(listingId) })
              }}
              onError={(createListingError) => setState({ createListingError })}
            >
              <span className="btn-content">Create Listing</span>
            </CreateListing>
            {Feedback('createListing')}
          </div>
        </div>
      </div>
      {/* <div className="form-group">
        <label>Logo</label>
        <div className="custom-file">
          <input type="file" {...input('logo')} className="custom-file-input" />
          <label className="custom-file-label">Choose logo file</label>
        </div>
        {Feedback('logo')}
      </div>
      <div className="form-group">
          <label>Favicon</label>
          <div className="custom-file">
            <input
              type="file"
              onChange={e => console.log(e.nativeEvent)}
              className="custom-file-input"
            />
            <label className="custom-file-label">Choose favicon file</label>
          </div>
          {Feedback('favicon')}
        </div> */}
      {state.shopType !== 'printful' ? null : (
        <div className="form-row">
          <div className="form-group col-md-6">
            <label>Printful API Key</label>
            <input type="password" {...input('printfulApi')} />
            {Feedback('printfulApi')}
          </div>
        </div>
      )}
      <div className="mb-2">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setAdvanced(!advanced)
          }}
          className="advanced-link"
        >
          {advanced ? 'Hide advanced settings' : 'Show advanced settings'}
        </a>
      </div>
      {!advanced ? null : (
        <>
          <div className="form-group">
            <label>Web3 PK (required for non-Eth payments)</label>
            <PasswordField field="web3Pk" input={input} />
            {Feedback('web3Pk')}
          </div>
          <div className="form-group">
            <label>Hostname</label>
            <div className="input-group">
              <input {...input('hostname')} placeholder="eg mystore" />
              <div className="input-group-append">
                <span className="input-group-text">
                  {`.${get(admin, 'network.domain')}`}
                </span>
              </div>
            </div>
            {Feedback('hostname')}
          </div>
          <div className="form-group">
            <label>Data Dir</label>
            <input {...input('dataDir')} placeholder="data" />
            {Feedback('dataDir')}
          </div>
          <div className="form-group">
            <label>Dshop API</label>
            <input
              {...input('backend')}
              placeholder="eg https://dshopapi.ogn.app"
            />
            {Feedback('backend')}
          </div>
          <div className="form-group">
            <label>PGP Private Key Password</label>
            <PasswordField input={input} field="pgpPrivateKeyPass" />
            {Feedback('pgpPrivateKeyPass')}
          </div>
          <div className="form-group">
            <label>PGP Private Key</label>
            <textarea {...input('pgpPrivateKey')} />
            {Feedback('pgpPrivateKey')}
          </div>
          <div className="form-group">
            <label>PGP Public Key</label>
            <textarea {...input('pgpPublicKey')} />
            {Feedback('pgpPublicKey')}
          </div>
        </>
      )}
      <button
        type="submit"
        className={`mt-3 btn btn-primary btn-lg align-self-center${
          loading ? ' disabled' : ''
        }`}
      >
        <span className="btn-content">
          {loading ? 'Deploying Shop...' : 'Continue'}
        </span>
      </button>
    </form>
  )
}

export default CreateShop
