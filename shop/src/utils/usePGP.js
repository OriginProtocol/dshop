import { useEffect, useState } from 'react'

function usePGP() {
  const [pgpLoaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

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
      setLoaded(true)
    }
    document.head.appendChild(pgpEl)
  }, [])

  return {
    pgpLoaded
  }
}

export default usePGP
