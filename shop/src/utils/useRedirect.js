import { useHistory } from 'react-router-dom'

function useRedirect() {
  const history = useHistory()
  return (pathname, state) =>
    history.push({ pathname, state: { scrollToTop: true, ...state } })
}

export default useRedirect
