import React from 'react'
import { useHistory } from 'react-router-dom'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'
import ConfirmationModal from 'components/ConfirmationModal'

const AdminMakeActiveNetwork = ({ network }) => {
  const history = useHistory()
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
        history.push({
          pathname: '/super-admin/networks',
          state: { scrollToTop: true }
        })
        dispatch({ type: 'reload', target: 'auth' })
      }}
    />
  )
}

export default AdminMakeActiveNetwork
