import React, { useEffect } from 'react'
import get from 'lodash/get'
import pick from 'lodash/pick'

import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'
import { NetworksById } from 'data/Networks'

import Modal from 'components/Modal'

import ShopReady from '../new-shop/ShopReady'
import ActivateBuild from './_ActivateBuild'

const AdminDeployShop = ({ className = '', shop, buttonText = 'Deploy' }) => {
  const [{ admin }, dispatch] = useStateValue()
  const { config } = useConfig()
  const [state, setState] = useSetState()
  useEffect(() => {
    if (state.deployShop) {
      fetch(`${config.backend}/shops/${shop.authToken}/deploy`, {
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify(pick(state, 'networkId', 'pinner', 'dnsProvider'))
      }).then((res) => {
        if (res.ok) {
          res.json().then(({ success, reason, hash, domain, gateway }) => {
            if (success === false) {
              setState({ error: reason })
            } else {
              setState({ deployed: true, hash, domain, gateway })
              dispatch({ type: 'reload', target: 'deployments' })
            }
          })
        }
      })
    }
  }, [state.deployShop])

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-primary ${className}`}
        onClick={() => setState({ deploy: true })}
      >
        {buttonText}
      </button>
      {!state.deploy ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => setState({}, true)}
        >
          <div className="modal-body text-center p-5">
            {state.error ? (
              <>
                <div className="text-lg">Error</div>
                <div className="alert alert-danger mt-3">{state.error}</div>
                <button
                  className="btn btn-outline-primary px-5"
                  onClick={() => setState({ shouldClose: true })}
                  children="OK"
                />
              </>
            ) : state.deployed ? (
              <Deployed {...{ state, setState, shop }} />
            ) : (
              <Deploy {...{ state, setState, admin, shop }} />
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

const Deploy = ({ state, setState, admin, shop }) => {
  const network = admin.networks.find((n) => {
    return String(n.networkId) === state.networkId
  })
  if (state.deployShop) {
    return <div className="text-lg">Deploying...</div>
  }
  return (
    <>
      <div className="text-lg">Deploy Shop</div>
      <div className="deploy-network-details mt-4">
        <div>Network</div>
        <div>
          <select
            value={state.networkId}
            onChange={(e) =>
              setState({
                pinner: '',
                dnsProvider: '',
                networkId: e.target.value
              })
            }
          >
            <option>Choose...</option>
            {admin.networks.map((network) => (
              <option key={network.networkId} value={network.networkId}>
                {get(NetworksById, `[${network.networkId}].name`)}
              </option>
            ))}
          </select>
        </div>
        {!network ? null : (
          <>
            <div>IPFS</div>
            <div>{network.ipfs}</div>
            {!network.pinataKey && !network.ipfsClusterPassword ? null : (
              <>
                <div>IPFS Pinner</div>
                <div>
                  <select
                    value={state.pinner}
                    onChange={(e) => setState({ pinner: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="pinata" disabled={!network.pinataKey}>
                      Pinata
                    </option>
                    <option
                      value="ipfs-cluster"
                      disabled={!network.ipfsClusterPassword}
                    >
                      IPFS Cluster
                    </option>
                  </select>
                </div>
              </>
            )}
            {!state.pinner ||
            (!network.cloudflareEmail && !network.gcpCredentials) ? null : (
              <>
                <div>DNS Provider</div>
                <div>
                  <select
                    value={state.dnsProvider}
                    onChange={(e) => setState({ dnsProvider: e.target.value })}
                  >
                    <option value="">None</option>
                    {network.cloudflareEmail ? (
                      <option value="cloudflare">Cloudflare</option>
                    ) : null}
                    {network.gcpCredentials ? (
                      <option value="gcp">GCP DNS</option>
                    ) : null}
                    <option value="unstoppable">Unstoppable Domains</option>
                  </select>
                </div>
                {state.dnsProvider !== 'cloudflare' ? null : (
                  <>
                    <div>Domain</div>
                    <div>{`${shop.authToken}.${network.domain}`}</div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="actions">
        <button
          className="btn btn-outline-primary px-5"
          onClick={() => setState({ shouldClose: true })}
          children="Cancel"
        />
        <button
          className={`btn btn-primary px-5 ml-3${
            state.networkId ? '' : ' disabled'
          }`}
          onClick={() => {
            if (!state.networkId) return
            setState({ deployShop: true })
          }}
          children="Deploy"
        />
      </div>
    </>
  )
}

const Deployed = ({ state, setState, shop }) => (
  <>
    <div className="text-lg">Shop deployed!</div>
    <ShopReady {...state} actions={false} />
    {state.dnsProvider === 'unstoppable' ? (
      <ActivateBuild {...state} shop={shop} ipfsHash={state.hash} />
    ) : null}
    <div className="actions mt-4">
      <button
        className="btn btn-primary px-5"
        onClick={() => setState({ shouldClose: true })}
        children="OK"
      />
    </div>
  </>
)

export default AdminDeployShop

require('react-styl')(`

  .deploy-network-details
    display: grid
    grid-template-columns: auto auto
    row-gap: 0.5rem
    column-gap: 1rem
    margin-bottom: 2rem
    > div:nth-child(odd)
      text-align: right
    > div:nth-child(even)
      text-align: left
`)
