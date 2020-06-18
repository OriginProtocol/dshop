import React, { useState } from 'react'

import Modal from 'components/Modal'

const SelectVariantImage = ({ selection, media, onChange }) => {

  const [showModal, setShowModal] = useState(false)
  const [shouldClose, setShouldClose] = useState(false)

  return (
    <>
      <div className="select-variant-image selectbox" onClick={e => setShowModal(true)}>
        <img src={selection.src} />
        <a className="btn btn-link" onClick={e => {
          e.preventDefault()
        }}>
          Change
        </a>
      </div>
      {!showModal ? null : (
        <Modal
          shouldClose={shouldClose}
          onClose={() => {
            setShouldClose(false)
            setShowModal(false)
          }}
          className="select-variant-image"
        >
          <h5>Select an image for the variant</h5>
          <div className="hero-image">
            <img src={selection.src} />
          </div>
          <div className="variant-media">
            {media.map(m => (
              <img 
                key={m.src} 
                src={m.src} 
                className={selection.src === m.src ? 'selected' : ''} 
                onClick={() => onChange(m)}
                />
            ))}
          </div>
          <div className="actions">
            <a className="btn btn-link" href="#" onClick={e => {
              e.preventDefault()
              setShouldClose(true)
            }}>Close</a>
          </div>
        </Modal>
      )}
    </>
  )
}

export default SelectVariantImage

require('react-styl')(`
  .select-variant-image
    &.selectbox
      display: flex
      flex-direction: column
      cursor: pointer
      justify-content: center
      align-items: center

      .btn.btn-link
        font-size: 0.625rem

    .modal-content
      padding: 1.125rem
      .variant-media
        display: flex
        flex-wrap: wrap
        margin-top: 1rem
        img 
          margin-right: 10px
          margin-bottom: 10px
          cursor: pointer
        .selected
          border: 1px solid #1990c6

      .hero-image img
        width: 100%
        height: auto
        margin-top: 1rem
        border: 1px solid #1990c6

    .actions
      display: flex
      align-items: center
      justify-content: center

    img 
      width: 50px
      height: 50px
      object-fit: contain
      border: 1px solid #dfe2e6
      border-radius: 5px
`)
