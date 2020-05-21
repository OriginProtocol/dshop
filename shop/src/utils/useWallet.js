import { useEffect, useState } from 'react'
import get from 'lodash/get'

function useWallet() {
  const [status, setStatus] = useState('loading')

  function enable() {
    window.ethereum.enable().then((enabled) => {
      if (enabled) {
        setStatus('enabled')
      } else {
        setStatus('disabled')
      }
    })
  }

  useEffect(() => {
    async function check() {
      if (!window.ethereum) {
        setStatus('no-web3')
        return
      }

      if (get(window, 'ethereum._metamask.isEnabled')) {
        const enabled = await window.ethereum._metamask.isEnabled()
        const unlocked = await window.ethereum._metamask.isUnlocked()
        const approved = await window.ethereum._metamask.isApproved()
        if (enabled && unlocked && approved) {
          setStatus('enabled')
          return
        }
      }

      setStatus('disabled')
    }
    check()
  }, [])

  return { enable, status }
}

export default useWallet
