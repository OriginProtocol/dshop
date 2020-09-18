import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import useConfig from 'utils/useConfig'

const ConfigLoader = ({ children }) => {
  const location = useLocation()
  const { config, setActiveShop } = useConfig()

  useEffect(() => {
    if (!config) {
      setActiveShop(true)
    }
  }, [config])

  useEffect(() => {
    if (location.state && location.state.scrollToTop) {
      window.scrollTo(0, 0)
    }
  }, [location.pathname])

  if (!config) {
    return 'Loading'
  }

  return children
}

export default ConfigLoader
