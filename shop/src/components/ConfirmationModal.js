import React, { useEffect } from 'react'

import useSetState from 'utils/useSetState'
import Modal from 'components/Modal'

const AdminConfirmationModal = ({
  className = 'btn btn-outline-primary',
  confirmedText = 'Success',
  confirmText = 'Are you sure?',
  onConfirm,
  onSuccess,
  onError,
  buttonText,
  children,
  proceedText = 'Yes',
  cancelText = 'No',
  loadingText = 'Loading...',
  validate = () => true,
  customEl,
  modalOnly,
  shouldShow,
  onClose
}) => {
  const [state, setState] = useSetState()

  useEffect(() => {
    if (state.doConfirm) {
      onConfirm()
        .then((response) => {
          if (onError && !response.success) {
            setState({ doConfirm: false, loading: false })
            onError(response)
          } else {
            setState({ response, confirmed: true })
          }
        })
        .catch((err) => {
          setState({ error: err.toString() })
        })
    }
  }, [state.doConfirm])

  useEffect(() => {
    if (shouldShow) {
      setState({ showModal: true })
    }
  }, [shouldShow])

  let btn
  if (customEl) {
    btn = React.cloneElement(customEl, {
      onClick: (e) => {
        e.preventDefault()
        setState({ showModal: true })
      }
    })
  } else if (!modalOnly) {
    btn = (
      <button
        type="button"
        className={className}
        onClick={() => setState({ showModal: true })}
      >
        {buttonText}
      </button>
    )
  }

  return (
    <>
      {btn}
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            if (state.confirmed) {
              onSuccess(state.response)
            }
            if (onClose) {
              onClose()
            }
            setState({}, true)
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
            ) : state.loading ? (
              <>
                <div className="text-lg">{loadingText}</div>
              </>
            ) : (
              <>
                <div className="text-lg">{confirmText}</div>
                {children}
                <div className="actions">
                  <button
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children={cancelText}
                  />
                  <button
                    className="btn btn-primary px-5 ml-3"
                    onClick={() => {
                      if (validate()) {
                        setState({ doConfirm: true, loading: true })
                      }
                    }}
                    children={proceedText}
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
