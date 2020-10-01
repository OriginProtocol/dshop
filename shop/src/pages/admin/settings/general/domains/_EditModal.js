import React, { useState } from 'react'
import fbt from 'fbt'

import Modal from 'components/Modal'

import { useStateValue } from 'data/state'

import useShopDeployments from 'utils/useShopDeployments'

import DomainInput from './_Input'
import DomainInstructions from './_Instructions'
import PublishChanges from './_Publish'

const EditCustomDomain = ({ domainObj, netId, hostname, onClose }) => {
  const [, dispatch] = useStateValue()
  const [shouldClose, setShouldClose] = useState()

  const [domain, setDomain] = useState(domainObj)
  const [currentStep, setStep] = useState(domainObj ? 'publish' : 'edit')

  const [canEdit] = useState(Boolean(domainObj))

  const { deployments } = useShopDeployments()

  return (
    <Modal
      onClose={() => {
        setShouldClose(false)
        setStep(canEdit ? 'publish' : 'edit')
        if (onClose) onClose()
      }}
      shouldClose={shouldClose}
    >
      {currentStep === 'publish' ? (
        <PublishChanges
          title={fbt(
            'Publish your shop',
            'admin.settings.general.domains.publishShop'
          )}
          description={fbt(
            'Your changes would appear on the domain only after it has been published',
            'admin.settings.general.domains.publishCustomDomainDesc'
          )}
          canSkip={deployments.length > 0}
          next={() => setStep('instructions')}
        />
      ) : currentStep === 'instructions' ? (
        <DomainInstructions
          domain={domain}
          close={() => setShouldClose(true)}
          netId={netId}
          hostname={hostname}
        />
      ) : (
        <DomainInput
          next={(data) => {
            setDomain(data.domain)
            setStep('publish')
            dispatch({ type: 'reload', target: 'domains' })
          }}
          cancel={() => setShouldClose(true)}
        />
      )}
    </Modal>
  )
}

export default EditCustomDomain

require('react-styl')(`
`)
