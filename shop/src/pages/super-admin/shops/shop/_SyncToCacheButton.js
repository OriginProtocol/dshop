import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'
import useConfig from 'utils/useConfig'

import Modal from 'components/Modal'

const AdminSyncToCache = ({ shop, className = '', hash, networkId }) => {
  const { config } = useConfig()
  const [state, setState] = useSetState({ syncShop: 0 })

  useEffect(() => {
    if (!state.syncShop) {
      return
    }
    fetch(`${config.backend}/shops/${shop.authToken}/sync-cache`, {
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ hash, networkId })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setState({ loading: false, error: '', synced: true })
        } else {
          setState({ loading: false, error: data.reason || 'Unknown error' })
        }
      })
      .catch((e) => {
        setState({ loading: false, error: e.toString() || 'Unknown error' })
      })
  }, [state.syncShop])

  return (
    <>
      <button
        type="button"
        className={`btn btn-outline-primary ${className}`}
        onClick={() => setState({ sync: true })}
        children="Sync to Cache"
      />
      {!state.sync ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() =>
            setState({
              shouldClose: false,
              sync: false,
              synced: false,
              syncShop: false
            })
          }
        >
          <div className="modal-body text-center p-5">
            {state.loading ? (
              <>
                <div className="text-lg">Shop syncing...</div>
              </>
            ) : state.synced ? (
              <>
                <div className="text-lg">Shop synced</div>
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
                  Are you sure you want to sync this shop?
                </div>
                {!state.error ? null : (
                  <div className="alert alert-danger mb-4">{state.error}</div>
                )}
                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="No"
                  />
                  <button
                    className="btn btn-primary px-5 ml-3"
                    onClick={() =>
                      setState({ loading: true, syncShop: state.syncShop + 1 })
                    }
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

export default AdminSyncToCache
