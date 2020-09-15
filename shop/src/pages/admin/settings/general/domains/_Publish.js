import React, { useEffect } from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import useShopConfig from 'utils/useShopConfig'

import DeployButton from './../../deployments/_DeployButton'

const PublishChanges = ({ description, title, next, canSkip = true }) => {
  const { shopConfig } = useShopConfig()
  const hasChanges = get(shopConfig, 'hasChanges')

  useEffect(() => {
    if (hasChanges === false) {
      next()
    }
  }, [hasChanges])

  return (
    <div className="modal-body p-5 shop-settings">
      <div className="text-lg text-center">{title}</div>
      <div className="description mt-3 text-center">{description}</div>
      <div className="actions text-center">
        {!canSkip ? null : (
          <button
            className="btn btn-outline-primary px-5"
            onClick={next}
            children={fbt('Skip', 'Skip')}
          />
        )}

        <DeployButton
          className="btn btn-primary px-5 ml-2"
          buttonText={
            <fbt desc="admin.PublishChanges.publish">Publish Now</fbt>
          }
          afterDeploy={next}
        />
      </div>
    </div>
  )
}

export default PublishChanges
