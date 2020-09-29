import { useEffect, useState } from 'react'

import useBackendApi from 'utils/useBackendApi'
import { useStateValue } from 'data/state'

const useShopDeployments = () => {
  const [{ reload, deployments }, dispatch] = useStateValue()
  const [loading, setLoading] = useState(true)
  const { get } = useBackendApi({ authToken: true })

  useEffect(() => {
    get('/shop/deployments')
      .then((res) =>
        dispatch({
          type: 'setDeployments',
          deployments: res.deployments
        })
      )
      .catch((err) => console.error(err))
      .then(() => setLoading(false))
  }, [reload.deployments])

  return {
    deployments,
    loading,
    reload: () => dispatch({ type: 'reload', target: 'deployments' })
  }
}

export default useShopDeployments
