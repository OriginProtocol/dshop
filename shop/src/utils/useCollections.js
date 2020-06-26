import { useEffect, useState } from 'react'
import memoize from 'lodash/memoize'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

const getCollections = memoize(
  async function (src) {
    return await fetch(`${src}collections.json`).then((res) => res.json())
  },
  (...args) => args.join('-')
)

function useCollections() {
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

  return { collections, loading }
}

export default useCollections
