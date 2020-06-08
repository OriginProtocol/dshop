import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'

import Modal from 'components/Modal'

const AdminDeleteAsset = ({ file, shop, className = '', onSuccess }) => {
  const { config } = useConfig()
  const [state, setState] = useSetState()
  useEffect(() => {
    if (state.deleteAsset) {
      fetch(`${config.backend}/shops/${shop.authToken}/assets`, {
        headers: {
          'content-type': 'application/json'
        },
        credentials: 'include',
        method: 'DELETE',
        body: JSON.stringify({ file })
      }).then((res) => {
        if (res.ok) {
          setState({ deleted: true })
        }
      })
    }
  }, [state.deleteAsset])

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
            setState({ delete: false })
            if (state.deleted) {
              onSuccess()
            }
          }}
        >
          <div className="modal-body text-center p-5">
            {state.deleted ? (
              <>
                <div className="text-lg">Asset deleted</div>
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
                  Are you sure you want to delete this asset?
                </div>
                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="No"
                  />
                  <button
                    className="btn btn-primary px-5 ml-3"
                    onClick={() => setState({ deleteAsset: true })}
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

export default AdminDeleteAsset
