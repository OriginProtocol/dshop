import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import Modal from 'components/Modal'

import ShopReady from '../ShopReady'

const AdminDeployShop = ({ className = '', shop }) => {
  const [{ admin }] = useStateValue()
  const { config } = useConfig()
  const [state, setState] = useSetState()
  useEffect(() => {
    if (state.deployShop) {
      fetch(`${config.backend}/shops/${shop.authToken}/deploy`, {
        headers: {
          'content-type': 'application/json'
        },
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({ networkId: state.networkId })
      }).then((res) => {
        if (res.ok) {
          res.json().then(({ hash, domain, gateway }) => {
            setState({ deployed: true, hash, domain, gateway })
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
        Deploy
      </button>
      {!state.deploy ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            setState({
              shouldClose: false,
              deploy: false,
              deployed: false,
              deployShop: false
            })
          }}
        >
          <div className="modal-body text-center p-5">
            {state.deployed ? (
              <Deployed {...{ state, setState }} />
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
  return (
    <>
      <div className="text-lg">Deploy Shop</div>
      <div className="d-flex align-items-center justify-content-center mb-4">
        <label className="mb-0">Network</label>
        <select
          value={state.networkId}
          onChange={(e) => setState({ networkId: e.target.value })}
          className="form-control w-auto ml-3"
        >
          <option>Choose...</option>
          {admin.networks.map((network) => (
            <option key={network.networkId} value={network.networkId}>
              {network.networkId}
            </option>
          ))}
        </select>
      </div>
      {!network ? null : (
        <div className="deploy-network-details">
          <div>IPFS</div>
          <div>{network.ipfs}</div>
          {/* <div>IPFS API</div>
          <div>{network.ipfsApi}</div> */}
          {!network.pinataKey ? null : (
            <>
              <div>Pinner</div>
              <div>Pinata</div>
            </>
          )}
          {!network.cloudflareEmail ? null : (
            <>
              <div>Domain</div>
              <div>{`${shop.authToken}.${network.domain}`}</div>
              <div>DNS</div>
              <div>Cloudflare</div>
            </>
          )}
        </div>
      )}

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

const Deployed = ({ state, setState }) => (
  <>
    <div className="text-lg">Shop deployed!</div>
    <ShopReady {...state} actions={false} />
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
