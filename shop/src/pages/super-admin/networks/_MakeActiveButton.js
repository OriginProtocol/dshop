import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'
import { NetworksById } from 'data/Networks'
import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'

import Modal from 'components/Modal'

const AdminMakeActiveNetwork = ({ network, className = '' }) => {
  const history = useHistory()
  const { config } = useConfig()
  const [, dispatch] = useStateValue()
  const [state, setState] = useSetState()
  useEffect(() => {
    if (state.doMakeActive) {
      const net = NetworksById[network.networkId]
      if (net) {
        localStorage.ognNetwork = net.idStr
        fetch(`${config.backend}/networks/${network.networkId}/make-active`, {
          credentials: 'include',
          method: 'POST'
        }).then((res) => {
          if (res.ok) {
            setState({ madeActive: true })
          }
        })
      }
    }
  }, [state.doMakeActive])

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-primary ${className}`}
        onClick={() => setState({ makeActive: true })}
      >
        Make Active
      </button>
      {!state.makeActive ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            if (state.madeActive) {
              history.push({
                pathname: '/super-admin/shops',
                state: { scrollToTop: true }
              })
              dispatch({ type: 'reload', target: 'auth' })
            } else {
              setState({}, true)
            }
          }}
        >
          <div className="modal-body text-center p-5">
            {state.madeActive ? (
              <>
                <div className="text-lg">Network Active</div>
                <div className="actions">
                  <button
                    className="btn btn-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="OK"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="text-lg">
                  Are you sure you want to make this network active?
                </div>
                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="No"
                  />
                  <button
                    className="btn btn-primary px-5 ml-3"
                    onClick={() => setState({ doMakeActive: true })}
                    children="Yes"
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

export default AdminMakeActiveNetwork
