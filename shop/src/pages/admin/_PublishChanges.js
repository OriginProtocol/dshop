import React from 'react'

import get from 'lodash/get'
import useShopConfig from 'utils/useShopConfig'
import DeployButton from './settings/deployments/_DeployButton'
import SwitchToStorefront from 'components/SwitchToStorefront'

const PublishChanges = () => {
  const { shopConfig } = useShopConfig()
  const hasChanges = get(shopConfig, 'hasChanges', false)

  if (!hasChanges) {
    return null
  }

  return (
    <div className="changes">
      <div>
        You have changes that have not been published. Click “Publish Changes”
        to make publicly visible.
      </div>
      <SwitchToStorefront
        className="btn btn-sm btn-outline-primary ml-auto px-4"
        children="Preview"
      />
      <DeployButton
        className="btn-primary btn-sm ml-2 px-3"
        buttonText="Publish Changes"
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
      font-weight: bold
`)
