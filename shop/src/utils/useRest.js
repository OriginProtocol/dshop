import { useEffect, useState } from 'react'
import useConfig from 'utils/useConfig'

function useRest(url, opts = {}) {
  const { config } = useConfig()
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(data[url] === undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData(url) {
      setLoading(true)
      try {
        const raw = await fetch(`${config.backend}${url}`, {
          credentials: 'include',
          headers: {
            authorization: `bearer ${config.backendAuthToken}`
          }
        })
        const res = await raw.json()
        if (res.error) {
          setError(true)
        } else {
          setData({ ...data, [url]: res })
        }
        setLoading(false)
      } catch (e) {
        setLoading(false)
        setError(true)
      }
    }
    if (data[url] === undefined && !opts.skip) {
      fetchData(url)
    }
  }, [url])

  return { data: data[url], loading, error }
}

export default useRest
