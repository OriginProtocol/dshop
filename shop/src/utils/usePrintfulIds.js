import { useEffect, useState } from 'react'

import useConfig from 'utils/useConfig'

let printfulIds

function usePrintfulIds() {
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchPrintfulIds() {
      setLoading(true)
      try {
        const raw = await fetch(`${config.dataSrc}printful-ids.json`)
        printfulIds = await raw.json()
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError(true)
      }
    }
    if (printfulIds === undefined) {
      fetchPrintfulIds()
    }
  }, [])

  return { printfulIds, loading, error }
}

export default usePrintfulIds
