import React, { useReducer } from 'react'

import pickBy from 'lodash/pickBy'

import Modal from 'components/Modal'

import Facebook from 'components/icons/Facebook'
import Twitter from 'components/icons/Twitter'
import Instagram from 'components/icons/Instagram'
import Medium from 'components/icons/Medium'
import YouTube from 'components/icons/YouTube'
import PlusIcon from 'components/icons/Plus'

import { formInput, formFeedback } from 'utils/formHelpers'

import Delete from './_Delete'

const networks = [
  {
    value: 'facebook',
    name: 'Facebook',
    icon: <Facebook />
  },
  {
    value: 'twitter',
    name: 'Twitter',
    icon: <Twitter />
  },
  {
    value: 'instagram',
    name: 'Instagram',
    icon: <Instagram />
  },
  {
    value: 'medium',
    name: 'Medium',
    icon: <Medium />
  },
  {
    value: 'youtube',
    name: 'YouTube',
    icon: <YouTube />
  }
]

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

const SocialLinks = ({ socialLinks, setSocialLinks }) => {
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

    setSocialLinks({
      [state.network]: state.link
    })

    setState({
      shouldClose: true,
      link: '',
      network: ''
    })
  }

  return (
    <>
      <div className="social-links">
        <div className="title">Social Media Links</div>
        <div className="links">
          {networks.map((network) => {
            if (!socialLinks[network.value]) return null

            return (
              <SocialLink
                icon={network.icon}
                name={network.name}
                key={network.value}
                removeLink={() =>
                  setSocialLinks({
                    [network.value]: ''
                  })
                }
              />
            )
          })}
        </div>
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-outline-primary d-flex align-items-center w-100"
            onClick={() => setState({ showModal: true })}
          >
            <PlusIcon className="mr-2" /> Add Link
          </button>
        </div>
      </div>
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
              <select {...input('network')}>
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

const SocialLink = ({ icon, name, removeLink }) => (
  <div>
    <div className="icon">{icon}</div>
    {name}
    <Delete className="ml-auto" onConfirm={removeLink} />
  </div>
)

export default SocialLinks

require('react-styl')(`
  .social-links
    border-radius: 10px
    border: solid 1px #cdd7e0
    background-color: #ffffff
    padding: 1.125rem
    font-size: 14px
    line-height: normal
    .title
      font-weight: bold
    .links
      > div
        a
          visibility: hidden
        &:hover a
          visibility: visible
        .icon
          background-color: #3b80ee
          width: 22px
          height: 22px
          border-radius: 11px
          margin-right: 0.5rem
          display: flex
          align-items: center
          justify-content: center
          svg
            flex: 1
            max-width: 60%
            max-height: 60%
            fill: #fff
        display: flex
        align-items: center
        &:first-child
          margin-top: 0.5rem
        &:not(:last-child)
          border-bottom: 1px solid #cdd7e0
        padding: 0.5rem 0
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
