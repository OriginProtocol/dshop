import React from 'react'
import fbt from 'fbt'
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
      <fbt desc="admin.PublishChanges.unpublishedChanges">
        You have changes that have not been published. Click “Publish Changes”
        to make publicly visible.
      </fbt>
      <div className="actions">
        <SwitchToStorefront
          className="btn btn-sm btn-outline-primary"
          children={<fbt desc="Preview">Preview</fbt>}
        />
        <DeployButton
          className="btn-primary btn-sm"
          buttonText={
            <fbt desc="admin.PublishChanges.publish">Publish Changes</fbt>
          }
        />
      </div>
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
    line-height: normal
    .actions
      display: grid
      margin-left: auto
      grid-auto-flow: column
      grid-auto-columns: 1fr
      column-gap: 0.5rem
      align-items: center
      .btn
        font-size: 12px
        font-weight: bold
        padding-left: 0.75rem
        padding-right: 0.75rem
        border-radius: 5px
        line-height: normal
        white-space: nowrap
`)
