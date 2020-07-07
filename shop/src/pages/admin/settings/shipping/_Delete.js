import React from 'react'

import ConfirmationModal from 'components/ConfirmationModal'
import useBackendApi from 'utils/useBackendApi'
import useShippingZones from 'utils/useShippingZones'
import { useStateValue } from 'data/state'

const DeleteShippingMethod = ({ className = '', shippingZone, children }) => {
  const [, dispatch] = useStateValue()
  const { shippingZones } = useShippingZones()
  const { post } = useBackendApi({ authToken: true })

  return (
    <ConfirmationModal
      buttonText="Delete"
      confirmText="Are you sure you want to delete this shipping method?"
      confirmedText="Shipping method deleted"
      onConfirm={() =>
        post('/shipping-zones', {
          method: 'PUT',
          body: JSON.stringify({
            shippingZones: shippingZones.filter((z) => z.id !== shippingZone.id)
          })
        })
      }
      onSuccess={() => {
        dispatch({ type: 'reload', target: 'shippingZones' })
      }}
      customEl={<div className={className}>{children}</div>}
    />
  )
}

export default DeleteShippingMethod
