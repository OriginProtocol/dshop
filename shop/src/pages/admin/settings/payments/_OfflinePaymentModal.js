import React, { useReducer, useState, useEffect } from 'react'

import get from 'lodash/get'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import kebabCase from 'lodash/kebabCase'
import fbt from 'fbt'

import { useStateValue } from 'data/state'

import Modal from 'components/Modal'
import ImagePicker from 'components/ImagePicker'

import { formInput, formFeedback } from 'utils/formHelpers'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  label: '',
  details: '',
  instructions: '',
  qrImage: ''
}

const validate = (state, qrImages) => {
  const newState = {}

  if (!state.label) {
    newState.labelError = fbt(
      'Name is required',
      'admin.settings.payments.offlinePayments.labelError'
    )
  }

  if (!state.details) {
    newState.detailsError = fbt(
      'Additional details are required',
      'admin.settings.payments.offlinePayments.detailsError'
    )
  }

  if (!state.instructions) {
    newState.instructionsError = fbt(
      'Payment instructions are required',
      'admin.settings.payments.offlinePayments.instructionsError'
    )
  }

  if (state.hasQRCode && !qrImages.length) {
    newState.qrImageError = fbt(
      'Upload a QR Image',
      'admin.settings.payments.offlinePayments.qrImageError'
    )
  }

  const valid = Object.keys(newState).every((f) => !f.endsWith('Error'))

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState
    }
  }
}

const OfflinePaymentModal = ({ paymentMethod, onClose, onUpdate }) => {
  const [{ config }] = useStateValue()

  const [state, setState] = useReducer(reducer, {
    showModal: false,
    shouldClose: false,
    ...initialState
  })

  const existingId = get(paymentMethod, 'id')
  const isEdit = existingId ? true : false

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const [qrImages, setQRImages] = useState([])

  useEffect(() => {
    const image = get(paymentMethod, 'qrImage')
    const newImageArray = !image
      ? []
      : [
          {
            src: image.includes('/__tmp/')
              ? image
              : `/${config.activeShop}/uploads/${image}`,
            path: image
          }
        ]
    setQRImages(newImageArray)

    const newState = {
      ...initialState,
      ...(paymentMethod || {}),
      hasQRCode: newImageArray.length ? true : false
    }

    if (paymentMethod) {
      newState.showModal = true
    }

    setState(newState)
  }, [paymentMethod])

  const saveMethod = async () => {
    const { valid, newState } = validate(state, qrImages)

    setState(newState)

    if (!valid) return

    setState({ saving: true, submitError: null })

    const uniqId = isEdit
      ? existingId
      : `${kebabCase(newState.label)}-${Date.now()}`
    const newMethod = {
      ...pick(newState, Object.keys(initialState)),
      qrImage: get(qrImages, '0.path', ''),
      id: uniqId,
      disabled: isEdit ? get(paymentMethod, 'disabled', false) : false
    }

    onUpdate(newMethod)

    setState({
      ...initialState,
      saving: false,
      shouldClose: true
    })
  }

  return (
    <>
      <button
        className="btn btn-outline-primary mt-3"
        type="button"
        onClick={() => setState({ showModal: true })}
      >
        +{' '}
        <fbt desc="admin.settings.payments.offlinePayments.addPaymentMethod">
          Add payment method
        </fbt>
      </button>
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            setState({
              showModal: false,
              shouldClose: false
            })
            if (onClose) onClose()
          }}
        >
          <div className="modal-body payment-method-modal manual">
            <h5>
              <fbt desc="admin.settings.payments.offlinePayments.setupOfflinePayment">
                Set up manual payment method
              </fbt>
            </h5>

            <div className="form-group">
              <label>
                <fbt desc="admin.settings.payments.offlinePayments.methodName">
                  Payment method name
                </fbt>
              </label>
              <input {...input('label')} />
              {Feedback('label')}
            </div>

            <div className="form-group">
              <label>
                <fbt desc="admin.settings.payments.offlinePayments.additionalDetails">
                  Additional details
                </fbt>
              </label>
              <div className="desc">
                <fbt desc="admin.settings.payments.offlinePayments.additionalDetailsDesc">
                  Displayed to customers when they are choosing a payment method
                </fbt>
              </div>
              <textarea {...input('details')} />
              {Feedback('details')}
            </div>

            <div className="form-group">
              <label>
                <fbt desc="admin.settings.payments.offlinePayments.paymentInstructions">
                  Payment instructions
                </fbt>
              </label>
              <div className="desc">
                <fbt desc="admin.settings.payments.offlinePayments.paymentInstructionsDesc">
                  Displayed to customers after they place an order with this
                  payment method
                </fbt>
              </div>
              <textarea {...input('instructions')} />
              {Feedback('instructions')}
            </div>

            <div className="form-check">
              <label className="form-check-label">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={state.hasQRCode}
                  onChange={(e) =>
                    setState({
                      hasQRCode: e.target.checked,
                      qrImageError: null
                    })
                  }
                />
                <fbt desc="admin.settings.payments.offlinePayments.includeQRCode">
                  Include a payment QR code
                </fbt>
              </label>
            </div>

            {!state.hasQRCode ? null : (
              <div
                className={`image-picker-container${
                  state.qrImageError ? ' is-invalid' : ''
                }`}
              >
                <ImagePicker
                  images={qrImages}
                  onChange={(images) => {
                    setQRImages(images)
                    if (state.qrImageError) {
                      setState({
                        qrImageError: null
                      })
                    }
                  }}
                  maxImages={1}
                  children={
                    <>
                      <img src="/images/upload.svg" />
                      <div className="btn btn-outline-primary">
                        <fbt desc="admin.settings.payments.offlinePayments.addImage">
                          Add Image
                        </fbt>
                      </div>
                    </>
                  }
                />
                {Feedback('qrImage')}
              </div>
            )}

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
                <fbt desc="Cancel">Cancel</fbt>
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={saveMethod}
                disabled={state.saving}
              >
                {state.saving ? (
                  <>
                    <fbt desc="Saving">Saving</fbt>
                  </>
                ) : (
                  <fbt desc="Save">Save</fbt>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default OfflinePaymentModal

require('react-styl')(`
  .form-check-label
    display: flex
    align-items: center
    .form-check-input
      position: relative
      margin-top: 0
      margin-right: 0.5rem

  .payment-method-modal.manual
    .image-picker
      .preview-row
        margin-left: auto
        margin-right: auto
    .image-picker-container
      margin-top: 1.5rem
      &.is-invalid .image-picker
        border-color: red

`)
