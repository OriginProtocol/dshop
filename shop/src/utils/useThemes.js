import { useEffect, useState } from 'react'
import { useStateValue } from 'data/state'
import useBackendApi from './useBackendApi'

function useThemes() {
  const [loading, setLoading] = useState(false)
  const [shouldReload, setReload] = useState(1)
  const [{ themes }, dispatch] = useStateValue()

  const { get } = useBackendApi({ authToken: true })

  useEffect(() => {
    const loadThemes = async () => {
      setLoading(true)
      const { data } = await get('/themes')
      dispatch({ type: 'setThemes', themes: data })
      setLoading(false)
    }

    loadThemes()
  }, [shouldReload])

  return {
    themes,
    loading,
    reload: () => setReload(shouldReload + 1)
  }
}

export default useThemes
