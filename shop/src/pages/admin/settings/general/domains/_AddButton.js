import React, { useState } from 'react'

import PlusIcon from 'components/icons/Plus'
import EditCustomDomain from './_EditModal'

const AddButton = ({ netId, hostname }) => {
  const [show, setShow] = useState()

  return (
    <>
      <a
        onClick={(e) => {
          e.preventDefault()
          setShow(true)
        }}
        href="#"
        className="btn btn-outline-primary mt-4"
      >
        <PlusIcon size="9" />
        <span className="ml-2">Add a custom domain</span>
      </a>
      {!show ? null : (
        <EditCustomDomain
          netId={netId}
          hostname={hostname}
          onClose={() => setShow(false)}
        />
      )}
    </>
  )
}

export default AddButton

require('react-styl')(`
`)
