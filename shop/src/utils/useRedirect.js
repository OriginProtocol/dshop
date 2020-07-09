import { useHistory } from 'react-router-dom'

function useRedirect() {
  const history = useHistory()
  return (pathname) => history.push({ pathname, state: { scrollToTop: true } })
}

export default useRedirect
