import { useEffect, useState } from 'react'

import { useStateValue } from 'data/state'

import useConfig from 'utils/useConfig'

function useCollections() {
  const { config } = useConfig()
  const [{ collections }, dispatch] = useStateValue()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    async function fetchCollections() {
      const raw = await fetch(`${config.dataSrc}collections.json`)
      const collections = await raw.json()
      setLoading(false)
      dispatch({ type: 'setCollections', collections })
    }
    if (!collections.length) {
      fetchCollections()
    }
  }, [])

  return { collections, loading }
}

export default useCollections
