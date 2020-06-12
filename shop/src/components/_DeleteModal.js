import React, { useState } from 'react'
// import Modal from 'react-bootstrap/Modal'
import Modal from 'components/Modal'

const DeleteModal = ({ onConfirm, onClose, children }) => {
  const [hideModal, setHideModal] = useState(false)

  return (
    <Modal
      show={!hideModal}
      centered={true}
      className="delete-discount-modal"
      onExited={() => {
        onClose()
      }}
      onHide={() => setHideModal(true)}
    >
      <Modal.Body>
        <div className="delete-content">{children}</div>
        <div className="actions">
          <button
            className="btn btn-outline-primary mr-2"
            onClick={() => setHideModal(true)}
          >
            No
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm()}>
            Yes
          </button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default DeleteModal

require('react-styl')(`
  .delete-discount-modal
    display: block

    .delete-content
      margin-top: 3rem
      font-size: 1.625rem
      text-align: center

    .actions
      margin: 2rem auto
      display: flex
      justify-content: center
      button
        width: 120px

`)
