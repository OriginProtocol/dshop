import React, { useReducer } from 'react'

import useBackendApi from 'utils/useBackendApi'

import Modal from 'components/Modal'

const reducer = (state, newState) => ({ ...state, ...newState })

const ConnectModal = ({ children, title, validate, onCancel, onClose }) => {
  const [state, setState] = useReducer(reducer, {
    showModal: false,
    shouldClose: false
  })

  const { post } = useBackendApi({ authToken: true })

  const onConnect = async () => {
    const { valid, newState } = validate()
    if (!valid) return

    setState({
      saving: 'saving'
    })

    try {
      await post('/shop/config', {
        method: 'PUT',
        body: JSON.stringify(newState)
      })
      setState({
        saving: 'ok'
      })
      setTimeout(() => {
        setState({ saving: '', shouldClose: true })
      }, 1500)
    } catch (err) {
      console.error(err)
      setState({
        saving: ''
      })
    }
  }

  return (
    <Modal
      shouldClose={state.shouldClose}
      onClose={() => {
        setState({
          showModal: false,
          shouldClose: false
        })
        onClose()
      }}
    >
      <div className="modal-body payment-method-modal">
        <h5>{title}</h5>
        {children}

        <div className="actions">
          <button
            className="btn btn-outline-primary mr-2"
            type="button"
            onClick={() => {
              setState({
                shouldClose: true
              })
              onCancel()
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onConnect}
            disabled={state.saving}
          >
            {state.saving === 'saving'
              ? 'Connecting...'
              : state.saving === 'ok'
              ? 'Connected ✅'
              : 'Connect'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConnectModal

require('react-styl')(`
  .payment-method-modal
    h5
      margin-top: 1rem
      text-align: center
    .actions
      border-top: 1px solid #cdd7e0
      padding-top: 1.25rem
      margin-top: 1.5rem
      display: flex
      justify-content: center

      .btn
        width: 135px
`)
