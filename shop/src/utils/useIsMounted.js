import { useEffect, useRef } from 'react'

export default function useIsMounted() {
  const isMounted = useRef(true)

  useEffect(() => () => (isMounted.current = false), [])

  return isMounted
}
