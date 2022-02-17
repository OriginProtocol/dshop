import { useEffect, useState } from 'react'
import useIsMounted from 'utils/useIsMounted'

function usePGP() {
  const [pgpLoaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const isMounted = useIsMounted()

  useEffect(() => {
    if (loading) {
      return
    }
    setLoading(true)

    const pgpEl = document.createElement('script')
    pgpEl.src = 'dist/openpgp.min.js'
    pgpEl.onload = async () => {
      openpgp.config.show_comment = false
      openpgp.config.show_version = false
      await openpgp.initWorker({ path: 'dist/openpgp.worker.min.js' })
      if (!isMounted.current) return
      setLoaded(true)
    }
    document.head.appendChild(pgpEl)
  }, [])

  return {
    pgpLoaded
  }
}

export default usePGP
