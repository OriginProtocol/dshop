import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'
import Modal from 'components/Modal'

const AdminConfirmationModal = ({
  className = 'btn btn-outline-primary',
  confirmedText = 'Success',
  confirmText = 'Are you sure?',
  onConfirm,
  onSuccess,
  children
}) => {
  const [state, setState] = useSetState()

  useEffect(() => {
    if (state.doConfirm) {
      onConfirm()
        .then(() => {
          setState({ confirmed: true })
        })
        .catch((err) => {
          setState({ error: err.toString() })
        })
    }
  }, [state.doConfirm])

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setState({ showModal: true })}
      >
        {children}
      </button>
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            if (state.confirmed) {
              onSuccess()
            } else {
              setState({}, true)
            }
          }}
        >
          <div className="modal-body text-center p-5">
            {state.error ? (
              <>
                <div className="text-lg">Error</div>
                <div className="alert alert-danger mt-3">{state.error}</div>
                <div className="actions">
                  <button
                    className="btn btn-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="OK"
                  />
                </div>
              </>
            ) : state.confirmed ? (
              <>
                <div className="text-lg">{confirmedText}</div>
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
                <div className="text-lg">{confirmText}</div>

                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children="No"
                  />
                  <button
                    className="btn btn-primary px-5 ml-3"
                    onClick={() => setState({ doConfirm: true })}
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

export default AdminConfirmationModal
