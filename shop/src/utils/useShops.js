import { useEffect, useState } from 'react'
import queryString from 'query-string'
import memoize from 'lodash/memoize'

import { useStateValue } from 'data/state'
import useBackendApi from 'utils/useBackendApi'

const getShops = memoize((key, url, get) => get(url))

function useShops() {
  const [loading, setLoading] = useState(false)
  const { get } = useBackendApi()
  const [{ shops, shopsPagination, reload, admin }, dispatch] = useStateValue()

  useEffect(() => {
    async function fetchShops() {
      setLoading(true)
      const qs = queryString.stringify({
        page: shopsPagination.page,
        search: shopsPagination.search
      })
      const url = `/shops${qs ? `?${qs}` : ''}`
      const { shops, pagination } = await getShops(
        `${url}-${reload.auth}-${admin.email}`,
        url,
        get
      )
      setLoading(false)
      dispatch({
        type: 'setShops',
        shops,
        pagination: { page: 1, ...shopsPagination, ...pagination }
      })
    }
    fetchShops()
  }, [reload.auth, shopsPagination.page, shopsPagination.search])

  return {
    shops,
    shopsPagination,
    loading
  }
}

export default useShops
