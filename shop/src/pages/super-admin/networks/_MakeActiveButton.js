import React from 'react'

import { useStateValue } from 'data/state'
import useRedirect from 'utils/useRedirect'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminMakeActiveNetwork = ({ network }) => {
  const redirectTo = useRedirect()
  const { post } = useBackendApi()
  const [, dispatch] = useStateValue()

  return (
    <ConfirmationModal
      buttonText="Make Active"
      confirmText="Are you sure you want to make this network active?"
      confirmedText="Network Active"
      onConfirm={() =>
        post(`/networks/${network.networkId}/make-active`, { method: 'POST' })
      }
      onSuccess={() => {
        redirectTo('/super-admin/networks')
        dispatch({ type: 'reload', target: 'auth' })
      }}
    />
  )
}

export default AdminMakeActiveNetwork
