import { useEffect, useRef } from 'react'

export default function useIsMounted() {
  // use something similar to the plain mutable class member
  const isMounted = useRef(true)

  // cleanup fires once when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return isMounted
}
