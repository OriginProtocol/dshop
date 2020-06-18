import React from 'react'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const PublishChanges = () => {
  const [{ hasChanges }, dispatch] = useStateValue()
  const { post } = useBackendApi({ authToken: true })
  if (!hasChanges) {
    return null
  }
  return (
    <div className="changes">
      <div>You have changes that have not been published.</div>
      <button
        className="btn btn-sm btn-outline-primary ml-4"
        onClick={() => window.open('/', 'dshop-preview')}
        children="Preview"
      />
      <ConfirmationModal
        className={`btn btn-sm btn-outline-primary ml-2`}
        buttonText="Publish"
        confirmText="Are you sure you want to publish your changes?"
        confirmedText="Changes Published"
        onConfirm={() => post(`/shops/deploy`)}
        onSuccess={() => {
          dispatch({ type: 'hasChanges', value: false })
        }}
      />
    </div>
  )
}

export default PublishChanges

require('react-styl')(`
  .changes
    display: flex
    background-color: #fff7d6
    border-bottom: 1px solid #ffda26
    padding: 0.5rem 2.5rem
    margin: -1.875rem -2.5rem 1.875rem -2.5rem
    font-size: 14px
    align-items: center
    .btn
      font-size: 12px
`)
