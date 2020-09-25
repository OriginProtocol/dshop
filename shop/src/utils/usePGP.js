import { useEffect } from 'react'

let loading = false
function usePGP() {
  useEffect(() => {
    if (loading) {
      return
    }
    loading = true

    const pgpEl = document.createElement('script')
    pgpEl.src = 'dist/openpgp.min.js'
    pgpEl.onload = () => {
      openpgp.config.show_comment = false
      openpgp.config.show_version = false
      openpgp.initWorker({ path: 'dist/openpgp.worker.min.js' })
    }
    document.head.appendChild(pgpEl)
  }, [])
}

export default usePGP
