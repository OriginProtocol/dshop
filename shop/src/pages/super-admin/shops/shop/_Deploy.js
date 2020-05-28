import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'
import { useStateValue } from 'data/state'

import Modal from 'components/Modal'

import ShopReady from '../ShopReady'

const AdminDeployShop = ({ shopId }) => {
  const [{ admin }] = useStateValue()
  const { config } = useConfig()
  const [state, setState] = useSetState()
  useEffect(() => {
    if (state.deployShop) {
      fetch(`${config.backend}/shops/${shopId}/deploy`, {
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
        className="btn btn-outline-primary"
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
            ) : (
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
                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="Cancel"
                  />
                  <button
                    className={`btn btn-primary px-5 ml-3${
                      state.network ? '' : ' disabled'
                    }`}
                    onClick={() => setState({ deployShop: true })}
                    children="Deploy"
                  />
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}

export default AdminDeployShop
