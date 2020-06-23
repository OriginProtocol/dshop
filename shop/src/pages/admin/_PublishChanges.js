import React from 'react'

import { useStateValue } from 'data/state'
import DeployButton from './settings/deployments/_DeployButton'

const PublishChanges = () => {
  const [{ hasChanges }] = useStateValue()
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
      <DeployButton className="btn-sm ml-2" />
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
