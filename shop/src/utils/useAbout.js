import { useState, useEffect } from 'react'

import useConfig from 'utils/useConfig'

function useAbout() {
  const { config } = useConfig()
  const [loading, setLoading] = useState(config.about ? true : false)
  const [about, setAbout] = useState()

  useEffect(() => {
    if (config.about) {
      setLoading(true)
      fetch(`${config.dataSrc}${config.about}`)
        .then((res) => {
          setLoading(false)
          if (res.ok) {
            res.text().then((body) => setAbout(body))
          }
        })
        .catch((err) => {
          console.error('Failed to load about page', err)
          setLoading(false)
        })
    }
  }, [config.about])

  return { about, loading }
}

export default useAbout
