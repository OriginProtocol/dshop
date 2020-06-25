import { useCallback } from 'react'

function useAutoFocus() {
  const autoFocus = useCallback((node) => {
    if (node !== null) {
      setTimeout(() => node.focus(), 50)
    }
  }, [])
  return autoFocus
}

export default useAutoFocus
