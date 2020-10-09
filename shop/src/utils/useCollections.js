import { useEffect, useMemo, useState } from 'react'
import memoize from 'lodash/memoize'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

const getCollections = memoize(
  async function (src) {
    return await fetch(`${src}collections.json`).then((res) => res.json())
  },
  (...args) => args.join('-')
)

function useCollections(opts = {}) {
  const { config } = useConfig()
  const [{ collections, reload }, dispatch] = useStateValue()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!config.dataSrc) return
    let isSubscribed = true
    setLoading(true)
    getCollections(config.dataSrc, reload.collections, config.activeShop).then(
      (collections) => {
        if (isSubscribed) {
          setLoading(false)
          dispatch({ type: 'setCollections', collections })
        }
      }
    )
    return () => (isSubscribed = false)
  }, [reload.collections, config.activeShop])

  const reloadCollections = () => {
    getCollections.cache.clear()
    dispatch({ type: 'reload', target: 'collections' })
  }

  const { allCollections, visibleCollections } = useMemo(() => {
    const allCollections = cloneDeep(collections)
    if (opts.includeAll) {
      allCollections.unshift({ id: 'all', title: opts.includeAll })
    }

    const visibleCollections = allCollections.filter(
      (c) => c.id !== 'home' && get(c, 'products.length')
    )

    return {
      allCollections,
      visibleCollections
    }
  }, [collections])

  return {
    collections: allCollections,
    visibleCollections,
    loading,
    reload: reloadCollections
  }
}

export default useCollections
