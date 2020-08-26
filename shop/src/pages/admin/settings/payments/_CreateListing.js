import React, { useState } from 'react'

import CreateListingTx from './_CreateListingTx'

const CreateListing = ({ className, children, onCreated }) => {
  const [submit, setSubmit] = useState()
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setSubmit(true)}
        children={children}
      />
      <CreateListingTx
        submit={submit}
        onCreated={onCreated}
        onReset={() => setSubmit(false)}
      />
    </>
  )
}

export default CreateListing
