import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'

import Modal from 'components/Modal'

const AdminDeleteShop = ({ shop, className = '' }) => {
  const history = useHistory()
  const { config } = useConfig()
  const [, dispatch] = useStateValue()
  const [state, setState] = useSetState()
  useEffect(() => {
    if (state.deleteShop) {
      fetch(`${config.backend}/shops/${shop.authToken}`, {
        headers: {
          'content-type': 'application/json'
        },
        credentials: 'include',
        method: 'DELETE'
      }).then((res) => {
        if (res.ok) {
          setState({ deleted: true })
        }
      })
    }
  }, [state.deleteShop])

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-danger ${className}`}
        onClick={() => setState({ delete: true })}
      >
        Delete
      </button>
      {!state.delete ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            if (state.deleted) {
              history.push({
                pathname: '/super-admin/shops',
                state: { scrollToTop: true }
              })
              dispatch({ type: 'reload', target: 'auth' })
            } else {
              setState({ shouldClose: false, delete: false })
            }
          }}
        >
          <div className="modal-body text-center p-5">
            {state.deleted ? (
              <>
                <div className="text-lg">Shop deleted</div>
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
                  Are you sure you want to delete this shop?
                </div>
                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="No"
                  />
                  <button
                    className="btn btn-primary px-5 ml-3"
                    onClick={() => setState({ deleteShop: true })}
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

export default AdminDeleteShop
