import React, { useState, useEffect } from 'react'
import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useShopConfig from 'utils/useShopConfig'
import useSetState from 'utils/useSetState'
import { useStateValue } from 'data/state'
import Link from 'components/Link'
import PasswordField from 'components/admin/PasswordField'

function validate(state) {
  const newState = {}

  if (!state.dataUrl) {
    newState.dataUrlError = 'Enter a data URL'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const defaultValues = {
  listener: false,
  dataUrl: '',
  publicUrl: '',
  printful: '',
  listingId: '',
  stripeBackend: '',
  stripeWebhookSecret: '',
  pgpPublicKey: '',
  pgpPrivateKey: '',
  pgpPrivateKeyPass: '',
  web3Pk: '',

  email: 'disabled',
  sendgridApiKey: '',
  sendgridUsername: '',
  sendgridPassword: '',
  mailgunSmtpServer: '',
  mailgunSmtpPort: '',
  mailgunSmtpLogin: '',
  mailgunSmtpPassword: '',
  awsRegion: '',
  awsAccessKey: '',
  awsAccessSecret: '',
  upholdApi: '',
  upholdClient: '',
  upholdSecret: '',
  bigQueryCredentials: '',
  bigQueryTable: ''
}

async function testKey({ msg, pgpPublicKey, pgpPrivateKey, pass }) {
  if (!pgpPrivateKey) {
    return 'No private key'
  }
  const pubKeyObj = await openpgp.key.readArmored(pgpPublicKey)
  const encrypted = await openpgp.encrypt({
    message: openpgp.message.fromText(msg),
    publicKeys: pubKeyObj.keys
  })

  const privateKey = await openpgp.key.readArmored(pgpPrivateKey)
  if (privateKey.err && privateKey.err.length) {
    throw privateKey.err[0]
  }
  const privateKeyObj = privateKey.keys[0]
  await privateKeyObj.decrypt(pass)

  const message = await openpgp.message.readArmored(encrypted.data)
  const options = { message, privateKeys: [privateKeyObj] }

  const plaintext = await openpgp.decrypt(options)

  return plaintext.data === msg ? '✅' : '❌'
}

const AdminSettings = ({ shop }) => {
  const { config } = useConfig(shop)
  const { shopConfig } = useShopConfig(shop)
  const [saving, setSaving] = useState()
  const [keyFromDb, setKeyFromDb] = useState()
  const [state, setState] = useSetState(defaultValues)
  const [keyValid, setKeyValid] = useState(false)
  const [, dispatch] = useStateValue()

  const pgpPublicKey = keyFromDb
    ? shopConfig.pgpPublicKey || ''
    : config.pgpPublicKey || ''

  useEffect(() => {
    if (shopConfig) {
      setState(shopConfig)
    } else {
      setState(defaultValues, true)
    }
  }, [shopConfig])

  useEffect(() => {
    setState({ listingId: config.listingId })
  }, [config.listingId])

  useEffect(() => {
    async function doTest() {
      try {
        const result = await testKey({
          pgpPublicKey,
          pgpPrivateKey: state.pgpPrivateKey,
          pass: state.pgpPrivateKeyPass,
          msg: 'Test'
        })
        setKeyValid(result)
      } catch (e) {
        setKeyValid(e.message)
      }
    }
    doTest()
  }, [pgpPublicKey, state.pgpPrivateKey, state.pgpPrivateKeyPass])

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()
        const { valid, newState } = validate(state)
        setState(newState)

        const cfgOk = await new Promise((resolve) => {
          fetch(`${state.dataUrl}config.json`)
            .then((res) => resolve(res.ok ? true : false))
            .catch(() => resolve(false))
        })
        if (!cfgOk) {
          dispatch({
            type: 'toast',
            message: 'Warning: Could not fetch config.json',
            style: 'error'
          })
        }

        if (valid) {
          setSaving(true)
          const token = shop ? shop.authToken : config.backendAuthToken
          const raw = await fetch(`${config.backend}/shop/config`, {
            headers: {
              authorization: `bearer ${encodeURIComponent(token)}`,
              'content-type': 'application/json'
            },
            credentials: 'include',
            method: 'PUT',
            body: JSON.stringify(newState)
          })
          if (raw.ok) {
            dispatch({ type: 'toast', message: 'Saved OK' })
            setSaving(false)
          }
        } else {
          window.scrollTo(0, 0)
        }
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        Server
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </h3>
      <div className="row mt-3">
        {/* <div className="form-group col-md-6">
          <label>Listener</label>
          <div className="btn-group d-block">
            <button
              className={`btn btn-${state.listener ? '' : 'outline-'}primary`}
              onClick={() => setState({ listener: true })}
            >
              On
            </button>
            <button
              className={`btn btn-${!state.listener ? '' : 'outline-'}primary`}
              onClick={() => setState({ listener: false })}
            >
              Off
            </button>
          </div>
        </div> */}

        <div className="form-group col-md-6">
          <label>Password protect site</label>
          <PasswordField field="password" input={input} />
          {Feedback('password')}
        </div>
        <div className="form-group col-md-6">
          <label>Listing ID</label>
          <input {...input('listingId')} />
          {Feedback('listingId')}
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label>Data URL</label>
            <input type="text" {...input('dataUrl')} />
            {Feedback('dataUrl')}
          </div>
          <div className="form-group">
            <label>Public URL</label>
            <input type="text" {...input('publicUrl')} />
            {Feedback('publicUrl')}
          </div>
          <div className="form-group">
            <label>Email Notifications</label>
            <select {...input('email')}>
              <option value="disabled">Disabled</option>
              <option value="sendgrid">Sendgrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="aws">AWS SES</option>
            </select>
            {Feedback('email')}
          </div>
          {state.email !== 'sendgrid' ? null : (
            <>
              <div className="form-group">
                <label>Sendgrid API Key</label>
                <PasswordField field="sendgridApiKey" input={input} />
                {Feedback('sendgridApiKey')}
              </div>
              <div className="row">
                <div className="form-group col-6">
                  <label>Username</label>
                  <input type="text" {...input('sendgridUsername')} />
                  {Feedback('sendgridUsername')}
                </div>
                <div className="form-group col-6">
                  <label>Password</label>
                  <PasswordField field="sendgridPassword" input={input} />
                  {Feedback('sendgridPassword')}
                </div>
              </div>
            </>
          )}
          {state.email !== 'mailgun' ? null : (
            <>
              <div className="row">
                <div className="form-group col-8">
                  <label>Host</label>
                  <input type="text" {...input('mailgunSmtpServer')} />
                  {Feedback('mailgunSmtpServer')}
                </div>
                <div className="form-group col-4">
                  <label>Port</label>
                  <input type="text" {...input('mailgunSmtpPort')} />
                  {Feedback('mailgunSmtpPort')}
                </div>
              </div>
              <div className="row">
                <div className="form-group col-6">
                  <label>Login</label>
                  <input type="text" {...input('mailgunSmtpLogin')} />
                  {Feedback('mailgunSmtpLogin')}
                </div>
                <div className="form-group col-6">
                  <label>Password</label>
                  <PasswordField field="mailgunSmtpPassword" input={input} />
                  {Feedback('mailgunSmtpPassword')}
                </div>
              </div>
            </>
          )}
          {state.email !== 'aws' ? null : (
            <>
              <div className="form-group">
                <label>AWS Region</label>
                <input type="text" {...input('awsRegion')} />
                {Feedback('awsRegion')}
              </div>
              <div className="row">
                <div className="form-group col-6">
                  <label>Access Key</label>
                  <input type="text" {...input('awsAccessKey')} />
                  {Feedback('awsAccessKey')}
                </div>
                <div className="form-group col-6">
                  <label>Secret</label>
                  <PasswordField field="awsAccessSecret" input={input} />
                  {Feedback('awsAccessSecret')}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="col-md-6">
          <div className="row">
            <div className="form-group col-md-6">
              <label>Stripe Backend</label>
              <PasswordField field="stripeBackend" input={input} />
              {Feedback('stripeBackend')}
            </div>
            <div className="form-group col-md-6">
              <label>Webhook Secret</label>
              <PasswordField field="stripeWebhookSecret" input={input} />
              {Feedback('stripeWebhookSecret')}
            </div>
          </div>
          <div className="form-group">
            <label>Printful API Key</label>
            <PasswordField field="printful" input={input} />
            {Feedback('printful')}
          </div>
          <div className="form-group">
            <label>Uphold payments</label>
            <select {...input('upholdApi')}>
              <option value="">Disabled</option>
              <option value="production">Production</option>
              <option value="sandbox">Sandbox</option>
            </select>
            {Feedback('upholdApi')}
          </div>
          {!state.upholdApi ? null : (
            <div className="row">
              <div className="form-group col-md-6">
                <label>Uphold Client</label>
                <input type="text" {...input('upholdClient')} />
                {Feedback('upholdClient')}
              </div>
              <div className="form-group col-md-6">
                <label>Uphold Secret</label>
                <PasswordField field="upholdSecret" input={input} />
                {Feedback('upholdSecret')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label className="d-flex justify-content-between">
              <div>PGP Public Key</div>
              <div>
                <a
                  href="#"
                  className={keyFromDb ? '' : 'font-weight-bold'}
                  onClick={(e) => {
                    e.preventDefault()
                    setKeyFromDb(false)
                  }}
                >
                  config.json
                </a>
                {' | '}
                <a
                  href="#"
                  className={keyFromDb ? 'font-weight-bold' : ''}
                  onClick={(e) => {
                    e.preventDefault()
                    setKeyFromDb(true)
                  }}
                >
                  DB
                </a>
              </div>
            </label>
            <textarea
              className="form-control"
              value={pgpPublicKey}
              rows={5}
              readOnly
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group">
            <label>PGP Private Key</label>
            <textarea rows="5" {...input('pgpPrivateKey')} />
            {Feedback('pgpPrivateKey')}
          </div>
        </div>
      </div>
      <div className="form-group">
        <label>PGP Public Key String</label>
        <input
          className="form-control"
          readOnly
          value={pgpPublicKey.replace(/\n/g, '\\n')}
        />
      </div>
      <div className="form-group">
        <label>PGP Private Key Password</label>
        <PasswordField field="pgpPrivateKeyPass" input={input} />
        {Feedback('pgpPrivateKeyPass')}
      </div>
      <div className="form-group">{`Keys match: ${keyValid}`}</div>
      <div className="form-group">
        <label>Web3 PK (used to make offers for non-crypto payments)</label>
        <PasswordField field="web3Pk" input={input} />
        {Feedback('web3Pk')}
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Big Query Table</label>
          <input {...input('bigQueryTable')} />
        </div>
        <div className="form-group col-md-6">
          <label>Big Query Credentials</label>
          <textarea rows="4" {...input('bigQueryCredentials')} />
        </div>
      </div>

      <div className="footer-actions">
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default AdminSettings
