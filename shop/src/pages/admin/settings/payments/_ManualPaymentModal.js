import React, { useReducer, useState, useEffect } from 'react'

import get from 'lodash/get'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import kebabCase from 'lodash/kebabCase'

import { useStateValue } from 'data/state'

import Modal from 'components/Modal'
import ImagePicker from 'components/ImagePicker'

import { formInput, formFeedback } from 'utils/formHelpers'
import useBackendApi from 'utils/useBackendApi'

const reducer = (state, newState) => ({ ...state, ...newState })

const initialState = {
  name: '',
  details: '',
  instructions: '',
  qrImage: ''
}

const validate = (state, qrImages) => {
  const newState = {}

  if (!state.name) {
    newState.nameError = 'Name is required'
  }

  if (!state.details) {
    newState.detailsError = 'Additional details are required'
  }

  if (!state.instructions) {
    newState.instructionsError = 'Payment instructions are required'
  }

  if (state.hasQRCode && !qrImages.length) {
    newState.qrImageError = 'Upload a QR Image'
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

const ManualPaymentModal = ({ paymentMethod, onClose }) => {
  const [{ config }, dispatch] = useStateValue()

  const { post } = useBackendApi({ authToken: true })

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
      : `${kebabCase(newState.name)}-${Date.now()}`
    const newMethod = {
      ...pick(newState, Object.keys(initialState)),
      qrImage: get(qrImages, '0.path', ''),
      id: uniqId
    }

    try {
      const manualPaymentMethods = get(config, 'manualPaymentMethods', [])
      const allMethods = [...(manualPaymentMethods || [])]
      const existingIndex = allMethods.findIndex((m) => m.id === uniqId)

      if (existingIndex >= 0) {
        allMethods[existingIndex] = newMethod
      } else {
        allMethods[allMethods.length] = newMethod
      }

      await post('/shop/config', {
        method: 'PUT',
        body: JSON.stringify({
          manualPaymentMethods: allMethods
        })
      })

      dispatch({
        type: 'setManualPaymentMethods',
        manualPaymentMethods: allMethods
      })

      dispatch({
        type: 'toast',
        message: 'Your changes have been saved'
      })

      setState({
        ...initialState,
        saving: false,
        shouldClose: true
      })
    } catch (err) {
      console.error(err)
      dispatch({
        type: 'toast',
        message: 'Something went wrong. Please try again.',
        style: 'error'
      })
      setState({
        saving: false
      })
    }
  }

  return (
    <>
      <button
        className="btn btn-outline-primary"
        type="button"
        onClick={() => setState({ showModal: true })}
      >
        + Add payment method
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
            <h5>Set up manual payment method</h5>

            <div className="form-group">
              <label>Payment method name</label>
              <input {...input('name')} />
              {Feedback('name')}
            </div>

            <div className="form-group">
              <label>Additional details</label>
              <div className="desc">
                Displayed to customers when they are choosing a payment method
              </div>
              <textarea {...input('details')} />
              {Feedback('details')}
            </div>

            <div className="form-group">
              <label>Payment instructions</label>
              <div className="desc">
                Displayed to customers after they place an order with this
                payment method
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
                Include a payment QR code
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
                      <div className="btn btn-outline-primary">Add Image</div>
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
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={saveMethod}
                disabled={state.saving}
              >
                {state.saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default ManualPaymentModal

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
