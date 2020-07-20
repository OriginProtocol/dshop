import { useMemo } from 'react'

const useSentry = () => {
  const state = useMemo(() => {
    if (window._sentryLoaded) {
      return {
        enabled: true,
        sentry: window.Sentry
      }
    }

    return {
      enabled: false
    }
  }, [window._sentryLoaded])

  return state
}

export default useSentry
