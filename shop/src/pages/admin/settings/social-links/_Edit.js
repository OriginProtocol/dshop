import React, { useReducer, useEffect } from 'react'

import pickBy from 'lodash/pickBy'

import Modal from 'components/Modal'
import PlusIcon from 'components/icons/Plus'

import { formInput, formFeedback } from 'utils/formHelpers'

import networks from './_networks'

const validate = (state) => {
  const newState = {}

  if (!state.network) {
    newState.networkError = 'Select a network'
  }

  if (!state.link) {
    newState.linkError = 'Link is required'
  } else {
    try {
      new URL(state.link)
    } catch (err) {
      newState.linkError = 'Not a valid URL'
    }
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return {
    valid,
    newState: {
      ...pickBy(state, (v, k) => !k.endsWith('Error')),
      ...newState
    }
  }
}

const reducer = (state, newState) => ({ ...state, ...newState })

const EditSocialLinkModal = ({ editMode, defaultValues, onChange }) => {
  const [state, setState] = useReducer(reducer, {
    showModal: false,
    shouldClose: false
  })

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)

  const addLink = async () => {
    const { valid, newState } = validate(state)

    setState(newState)

    if (!valid) return

    onChange({
      [state.network]: state.link
    })

    setState({
      shouldClose: true,
      link: '',
      network: ''
    })
  }

  useEffect(() => {
    setState(defaultValues)
  }, [defaultValues])

  return (
    <>
      {editMode ? (
        <a
          className="ml-auto"
          onClick={(e) => {
            e.preventDefault()
            setState({ showModal: true })
          }}
        >
          <img src="images/edit-icon.svg" />
        </a>
      ) : (
        <button
          type="button"
          className="btn btn-outline-primary d-flex align-items-center w-100"
          onClick={() => setState({ showModal: true })}
        >
          <PlusIcon className="mr-2" /> Add Link
        </button>
      )}
      {!state.showModal ? null : (
        <Modal
          shouldClose={state.shouldClose}
          onClose={() => {
            setState({
              shouldClose: false,
              showModal: false
            })
          }}
        >
          <div className="modal-body add-social-link-modal">
            <h5>Add a Social Media Link</h5>
            <div className="form-group">
              <label>Network</label>
              <select {...input('network')} disabled={editMode}>
                <option>Select one</option>
                {networks.map((network) => (
                  <option key={network.value} value={network.value}>
                    {network.name}
                  </option>
                ))}
              </select>
              {Feedback('network')}
            </div>
            <div className="form-group">
              <label>Link URL</label>
              <input
                {...input('link')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLink()
                  }
                }}
              />
              {Feedback('link')}
            </div>

            <div className="actions">
              <button
                className="btn btn-outline-primary mr-2"
                type="button"
                onClick={() =>
                  setState({
                    shouldClose: true,
                    link: '',
                    network: ''
                  })
                }
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={addLink}
              >
                Add
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

export default EditSocialLinkModal

require('react-styl')(`
  .add-social-link-modal
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
        width: 120px

`)
