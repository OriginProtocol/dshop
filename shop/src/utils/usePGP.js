import { useEffect, useState } from 'react'

let loading = false
function usePGP() {
  const [pgpLoaded, setLoaded] = useState()

  useEffect(() => {
    if (loading) {
      return
    }
    loading = true

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
