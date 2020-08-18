import React, { useEffect, useState } from 'react'
import fbt from 'fbt'

const Loading = () => {
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    const to = setTimeout(() => {
      setHidden(false)
    }, 100)
    return function cleanup() {
      clearTimeout(to)
    }
  })
  return hidden ? null : (
    <>
      <fbt desc="Loading">Loading</fbt>...
    </>
  )
}

export default Loading
