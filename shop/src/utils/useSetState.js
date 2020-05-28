import { useState } from 'react'

function useSetState(initialState) {
  const [state, setStateRaw] = useState(initialState || {})
  const setState = (newState, force) => {
    return setStateRaw(force ? newState : { ...state, ...newState })
  }

  return [state, setState]
}

export default useSetState
