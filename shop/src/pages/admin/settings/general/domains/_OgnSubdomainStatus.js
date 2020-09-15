import React, { useState } from 'react'
import _get from 'lodash/get'

import fbt from 'fbt'

import Modal from 'components/Modal'
import { useStateValue } from 'data/state'
import useShopConfig from 'utils/useShopConfig'
import DomainStatus from './_DomainStatus'
import PublishChanges from './_Publish'

const OgnSubdomainStatus = ({ hostname }) => {
  const [{ admin }] = useStateValue()

  const [infoModal, setInfoModal] = useState(false)
  const [shouldClose, setShouldClose] = useState(false)

  const domain = `${hostname}.${_get(admin, 'network.domain')}`

  const { shopConfig } = useShopConfig()
  const needsPublishing = _get(shopConfig, 'hasChanges', false)

  return (
    <>
      <DomainStatus
        status={needsPublishing ? 'ToPublish' : 'Success'}
        onInfoClick={!needsPublishing ? null : () => setInfoModal(true)}
      />
      {!infoModal ? null : (
        <Modal
          onClose={() => {
            setShouldClose(false)
            setInfoModal(false)
          }}
          shouldClose={shouldClose}
        >
          <PublishChanges
            title={fbt(
              'Publish your shop',
              'admin.settings.general.domains.publishShop'
            )}
            description={fbt(
              `Your store will be live on ${fbt.param(
                'domain',
                domain
              )} once it has been published`,
              'admin.settings.general.domains.publishDesc'
            )}
            canSkip={false}
            next={() => {
              setShouldClose(true)
            }}
          />
        </Modal>
      )}
    </>
  )
}

require('react-styl')(`
`)

export default OgnSubdomainStatus
