import React, { useEffect } from 'react'

import fbt from 'fbt'

import useSetState from 'utils/useSetState'
import Modal from 'components/Modal'
import { Spinner } from 'components/icons/Admin'

const AdminConfirmationModal = ({
  className = 'btn btn-outline-primary',
  confirmedText = fbt('Success', 'success'),
  confirmText = fbt('Are you sure?', 'areYouSure'),
  onConfirm,
  onSuccess,
  onError,
  buttonText,
  children,
  proceedText = fbt('Yes', 'yes'),
  cancelText = fbt('No', 'no'),
  loadingText = `${fbt('Loading', 'Loading')}...`,
  validate = () => true,
  customEl,
  modalOnly,
  shouldShow,
  onClose,
  spinner
}) => {
  const [state, setState] = useSetState()

  useEffect(() => {
    let isSubscribed = true
    if (state.doConfirm) {
      onConfirm()
        .then((response) => {
          if (!isSubscribed) return
          if (onError && !response.success) {
            setState({ doConfirm: false, loading: false })
            onError(response)
          } else if (!confirmedText) {
            setState({ shouldClose: true, response })
          } else {
            setState({ response, confirmed: true })
          }
        })
        .catch((err) => {
          if (!isSubscribed) return
          setState({ error: err.toString() })
        })
    }
    return () => (isSubscribed = false)
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
        e.stopPropagation()
        setState({ showModal: true })
      }
    })
  } else if (!modalOnly) {
    btn = (
      <button
        type="button"
        className={className}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setState({ showModal: true })
        }}
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
            if (state.response) {
              onSuccess(state.response)
            }
            if (onClose) {
              onClose()
            }
            setState({}, true)
          }}
        >
          <form
            autoComplete="off"
            className="modal-body text-center p-5"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (validate()) {
                setState({ doConfirm: true, loading: true })
              }
            }}
          >
            {state.error ? (
              <>
                <div className="text-lg">
                  <fbt desc="error">Error</fbt>
                </div>
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
                    children={<fbt desc="ok">OK</fbt>}
                  />
                </div>
              </>
            ) : state.loading && loadingText !== false ? (
              <>
                <div className="text-lg">{loadingText}</div>
                {!spinner ? null : (
                  <div className="mt-4">
                    <Spinner />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-lg">{confirmText}</div>
                {children}
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-outline-primary px-5"
                    onClick={() => setState({ shouldClose: true })}
                    children={cancelText}
                  />
                  <button
                    className={`btn btn-primary px-5 ml-3${
                      state.loading ? ' disabled' : ''
                    }`}
                    children={proceedText}
                  />
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </>
  )
}

export default AdminConfirmationModal
