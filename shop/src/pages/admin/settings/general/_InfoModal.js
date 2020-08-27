import React, { useState } from 'react'

import Modal from 'components/Modal'

const InfoModal = ({ onClose, description, title }) => {
  const [shouldClose, setShouldClose] = useState()

  return (
    <Modal onClose={onClose} shouldClose={shouldClose}>
      <div className="modal-body p-5 shop-settings">
        <div className="text-lg text-center">{title}</div>
        <div className="description mt-3 text-center">
          {description}
        </div>
        <div className="actions text-center">
          <button
            className="btn btn-outline-primary px-5"
            onClick={() => setShouldClose(true)}
            children="Cancel"
          />
          <button
            className="btn btn-primary px-4 ml-2"
            onClick={() => setShouldClose(true)}
            children="Publish now"
          />
        </div>
      </div>
    </Modal>
  )
}

export default InfoModal
