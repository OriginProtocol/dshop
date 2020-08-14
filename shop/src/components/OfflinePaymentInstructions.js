import React, { useReducer } from 'react'
import fbt from 'fbt'
import useConfig from 'utils/useConfig'

import Modal from './Modal'

const reducer = (state, newState) => ({ ...state, ...newState })

const PaymentInstructions = ({ buttonText, paymentMethod }) => {
  const { config } = useConfig()
  const [state, setState] = useReducer(reducer, {
    showModal: false,
    shouldClose: false
  })

  if (!paymentMethod) {
    return null
  }

  const image = paymentMethod.qrImage

  const imageURL = !image
    ? null
    : image.includes('/__tmp/')
    ? image
    : `${config.activeShop}/uploads/${image}`

  return (
    <>
      <button
        className="btn btn-link mx-0 px-0 d-block"
        onClick={() => {
          setState({
            showModal: true
          })
        }}
        type="button"
      >
        {buttonText ||
          fbt('How to pay?', 'component.OfflinePaymentInstructions.howToPay')}
      </button>
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            setState({
              showModal: false,
              shouldClose: false
            })
          }}
        >
          <div className="modal-body payment-method-modal payment-instructions">
            <h5>
              <fbt desc="PaymentInstructions">Payment Instructions</fbt>
            </h5>
            <div className="inst-content">
              <div className="instructions">{paymentMethod.instructions}</div>
              {!image ? null : <img src={imageURL} />}
            </div>
            <div className="actions">
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() =>
                  setState({
                    shouldClose: true
                  })
                }
              >
                <fbt desc="Close">Close</fbt>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default PaymentInstructions

require('react-styl')(`
  .payment-instructions
    .inst-content
      display: flex
      .instructions
        flex: 1
      img
        flex: auto 0 0
        width: 120px
        height: 120px
        margin-left: 1rem
        object-fit: contain
`)
