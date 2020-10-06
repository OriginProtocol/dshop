import React, { useState, useEffect, useMemo } from 'react'

import useSetState from 'utils/useSetState'
import { Networks } from 'data/Networks'
import { formInput, formFeedback } from 'utils/formHelpers'
import PasswordField from 'components/admin/PasswordField'

import useEmailAppsList from 'utils/useEmailAppsList'
import ProcessorsList from 'components/settings/ProcessorsList'

import AWSModal from '../../admin/settings/apps/AWSModal'
import MailgunModal from '../../admin/settings/apps/MailgunModal'
import SendgridModal from '../../admin/settings/apps/SendgridModal'

const Defaults = {
  1: {
    ipfs: 'https://fs-autossl.ogn.app',
    ipfsApi: 'https://fs.ogn.app',
    marketplaceContract: '0x698Ff47B84837d3971118a369c570172EE7e54c2',
    marketplaceVersion: '001',
    provider: '',
    providerWs: ''
  },
  4: {
    ipfs: 'https://fs-autossl.staging.ogn.app',
    ipfsApi: 'https://fs.staging.ogn.app',
    marketplaceContract: '0x3D608cCe08819351adA81fC1550841ebc10686fd',
    marketplaceVersion: '001',
    provider: '',
    providerWs: ''
  },
  999: {
    ipfs: process.env.IPFS_GATEWAY || 'http://localhost:8080',
    ipfsApi: process.env.IPFS_API || 'http://localhost:5002',
    marketplaceContract: process.env.MARKETPLACE_CONTRACT,
    marketplaceVersion: '001',
    domain: 'localhost',
    provider: 'http://localhost:8545',
    providerWs: 'ws://localhost:8545'
  }
}

const _defaultShopConfigJSON = {
  web3Pk: '',
  stripeBackend: '',
  stripeWebhookSecret: '',
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
  bigQueryTable: '',
  googleAnalytics: '',
  notificationEmail: '',
  notificationEmailDisplayName: ''
}

const defaultShopConfig = JSON.stringify(_defaultShopConfigJSON, null, 2)

function initialState() {
  const networkId = window.location.href.indexOf('https') === 0 ? '1' : '999'
  const backendUrl = window.location.origin
  return {
    networkId,
    domain: '',
    provider: '',
    providerWs: '',
    pinataKey: '',
    pinataSecret: '',
    ipfsClusterUser: '',
    ipfsClusterPassword: '',
    cloudflareEmail: '',
    cloudflareApiKey: '',
    gcpCredentials: '',
    defaultShopConfig,
    ipfs: '',
    ipfsApi: '',
    listingId: '',
    marketplaceContract: '',
    marketplaceVersion: '',
    googleAnalytics: '',
    paypalEnvironment: 'prod',
    notificationEmail: '',
    notificationEmailDisplayName: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    backendUrl,
    ...Defaults[networkId]
  }
}

function validate(state) {
  const newState = {}

  if (!state.domain) {
    newState.domainError = 'Enter a root domain'
  }
  if (!state.ipfs) {
    newState.ipfsError = 'Enter an IPFS Gateway'
  }
  if (!state.ipfsApi) {
    newState.ipfsApiError = 'IPFS API required'
  }
  if (!state.notificationEmail) {
    newState.notificationEmailError = 'Email is required'
  }
  if (!state.notificationEmailDisplayName) {
    newState.notificationEmailDisplayNameError = 'Display name is required'
  }
  if (!state.backendUrl) {
    newState.backendUrlError = 'Backend URL required'
  } else if (!state.backendUrl.match(/^https?:\/\//)) {
    newState.backendUrlError = 'Should start https:// or http://'
  }
  if (!state.listingId) {
    newState.listingIdError = 'Marketplace listing ID required'
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const NetworkForm = ({ onSave, network, feedback, className }) => {
  const [advanced, setAdvanced] = useState(false)
  // NOTE: defaultShopConfig is stored as string, probably
  // to make it editable from a text field.
  // Should change it to JSON at some point in future like fallbackShopConfig
  if (network && !network.defaultShopConfig) {
    network.defaultShopConfig = defaultShopConfig
  }
  if (network && !network.fallbackShopConfig) {
    network.fallbackShopConfig = _defaultShopConfigJSON
  }
  const [state, setState] = useSetState(network || initialState())
  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  useEffect(() => {
    if (!network && Defaults[state.networkId]) {
      setState(Defaults[state.networkId])
    }
  }, [state.networkId])

  const [configureEmailModal, setConfigureEmailModal] = useState(false)
  const { emailAppsList } = useEmailAppsList({
    shopConfig: state.fallbackShopConfig
  })

  const ProcessorIdToEmailComp = {
    sendgrid: SendgridModal,
    aws: AWSModal,
    mailgun: MailgunModal
  }

  const ActiveEmailModalComp = ProcessorIdToEmailComp[configureEmailModal]

  const emailProcessors = useMemo(() => {
    return emailAppsList.map((processor) => ({
      ...processor,
      actions: (
        <>
          {processor.enabled ? (
            <>
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() => setConfigureEmailModal(processor.id)}
              >
                Configure
              </button>
              {/* <DisconnectModal
                processor={processor}
                afterDelete={() => refetch()}
              /> */}
            </>
          ) : (
            <button
              className="btn btn-outline-primary mr-2"
              type="button"
              onClick={() => setConfigureEmailModal(processor.id)}
            >
              Connect
            </button>
          )}
        </>
      )
    }))
  }, [emailAppsList])

  return (
    <form
      className={`sign-up${className ? ' ' + className : ''}`}
      onSubmit={(e) => {
        e.preventDefault()

        const { valid, newState } = validate(state)
        setState(newState)

        if (!valid) {
          window.scrollTo(0, 0)
          return
        }

        const network = Object.keys(state)
          .filter((k) => k.indexOf('Error') < 0)
          .reduce((m, o) => {
            m[o] = state[o]
            return m
          }, {})

        onSave(network)
      }}
    >
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Ethereum Network</label>
          <select {...input('networkId')}>
            {Networks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
          {Feedback('networkId')}
        </div>
        <div className="form-group col-md-6">
          <label>Root Domain</label>
          <input {...input('domain')} placeholder="eg mydshop.com" />
          {Feedback('domain')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Marketplace Listing ID</label>
          <input {...input('listingId')} placeholder="eg 1-001-12345" />
          {Feedback('listingId')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>IPFS Gateway</label>
          <input
            {...input('ipfs')}
            placeholder="eg https://fs-autossl.ogn.app'"
          />
          {Feedback('ipfs')}
        </div>
        <div className="form-group col-md-6">
          <label>IPFS API</label>
          <input {...input('ipfsApi')} placeholder="eg https://fs.ogn.app" />
          {Feedback('ipfsApi')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Web3 PK</label>
          <PasswordField field="web3Pk" input={input} />
          {Feedback('web3Pk')}
        </div>
        <div className="form-group col-md-6">
          <label>Backend Public URL</label>
          <input {...input('backendUrl')} />
          {Feedback('backendUrl')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Notification Emails</label>
          <input
            {...input('notificationEmail')}
            placeholder="eg no-reply@domain.com"
          />
          {Feedback('notificationEmail')}
        </div>
        <div className="form-group col-md-6">
          <label>Email Display Name</label>
          <input
            {...input('notificationEmailDisplayName')}
            placeholder="eg Origin Dshop"
          />
          {Feedback('notificationEmailDisplayName')}
        </div>
      </div>
      <div className="form-group">
        <label className="m-0">
          <input
            className="mr-2"
            type="checkbox"
            checked={state.publicSignups ? true : false}
            onChange={(e) => setState({ publicSignups: e.target.checked })}
          />
          Allow New User Signups
        </label>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Pinata Key</label>
          <input {...input('pinataKey')} />
          {Feedback('pinataKey')}
        </div>
        <div className="form-group col-md-6">
          <label>Pinata Secret</label>
          <PasswordField field="pinataSecret" input={input} />
          {Feedback('pinataSecret')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>IPFS Cluster User</label>
          <input {...input('ipfsClusterUser')} />
          {Feedback('ipfsClusterUser')}
        </div>
        <div className="form-group col-md-6">
          <label>IPFS Cluster Password</label>
          <PasswordField field="ipfsClusterPassword" input={input} />
          {Feedback('ipfsClusterPassword')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Cloudflare Email</label>
          <input {...input('cloudflareEmail')} />
          {Feedback('cloudflareEmail')}
        </div>
        <div className="form-group col-md-6">
          <label>Cloudflare API Key</label>
          <PasswordField field="cloudflareApiKey" input={input} />
          {Feedback('cloudflareApiKey')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-12">
          <label>GCP Service Account Credentials</label>
          <textarea {...input('gcpCredentials')}></textarea>
          {Feedback('gcpCredentials')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>AWS Access Key ID</label>
          <input {...input('awsAccessKeyId')} />
          {Feedback('awsAccessKeyId')}
        </div>
        <div className="form-group col-md-6">
          <label>AWS Secret Access Key</label>
          <PasswordField field="awsSecretAccessKey" input={input} />
          {Feedback('awsSecretAccessKey')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Discord Webhook</label>
          <PasswordField field="discordWebhook" input={input} />
          {Feedback('discordWebhook')}
        </div>
        <div className="form-group col-md-6">
          <label>UI CDN</label>
          <input {...input('uiCdn')} />
          {Feedback('uiCdn')}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Google Analytics</label>
          <input {...input('googleAnalytics')} />
          {Feedback('googleAnalytics')}
        </div>
        <div className="form-group col-md-6">
          <label>PayPal Environment</label>
          <select {...input('paypalEnvironment')}>
            <option value="prod">Production</option>
            <option value="sandbox">Sandbox</option>
          </select>
          {Feedback('paypalEnvironment')}
        </div>
      </div>

      <div className="my-3">
        <label>Configure email server</label>
        <ProcessorsList processors={emailProcessors} />
        {!ActiveEmailModalComp ? null : (
          <ActiveEmailModalComp
            initialConfig={state.fallbackShopConfig}
            onClose={() => {
              setConfigureEmailModal(false)
            }}
            overrideOnConnect={(newState) =>
              setState({
                fallbackShopConfig: {
                  ...state.fallbackShopConfig,
                  ...newState
                }
              })
            }
          />
        )}
      </div>

      <div className="mb-2 justify-content-center d-flex advanced-settings-link">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            setAdvanced(!advanced)
          }}
        >
          {advanced ? 'Hide advanced settings' : 'Show advanced settings'}
        </a>
      </div>

      {!advanced ? null : (
        <>
          <div className="form-row">
            <div className="form-group col-md-12">
              <label>Default Shop Config</label>
              <textarea
                {...input('defaultShopConfig')}
                value={state.defaultShopConfig}
              ></textarea>
              {Feedback('defaultShopConfig')}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <label>Marketplace Contract</label>
              <input
                {...input('marketplaceContract')}
                placeholder="eg 0x123456"
              />
              {Feedback('marketplaceContract')}
            </div>
            <div className="form-group col-md-6">
              <label>Marketplace Version</label>
              <input {...input('marketplaceVersion')} placeholder="eg 001" />
              {Feedback('marketplaceVersion')}
            </div>
          </div>
        </>
      )}
      <div className="d-flex mt-2 align-items-center">
        <button
          type="submit"
          className="btn btn-primary align-self-center px-5"
          children="Save"
        />
        {feedback ? <div className="ml-3">{feedback}</div> : null}
      </div>
    </form>
  )
}

export default NetworkForm
