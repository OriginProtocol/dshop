import React, { useReducer, useState, useEffect } from 'react'
import { useSpring, animated } from 'react-spring'

import { useStateValue } from 'data/state'

let savedState = {}
const reducer = (state, newState) => {
  savedState = { ...state, ...newState }
  return savedState
}

const Toaster = () => {
  const [{ toasts }] = useStateValue()
  const [hidden, setHidden] = useReducer(reducer, savedState)
  const visibleToasts = toasts.filter((t) => !hidden[t.id])

  return (
    <>
      {visibleToasts.map((toast, num) => (
        <Toast
          key={toast.id}
          num={num}
          onHide={(id) => {
            setHidden({ [id]: true })
            savedState[id] = true
          }}
          {...toast}
        />
      ))}
    </>
  )
}

const Toast = ({ id, num, message, onHide }) => {
  const [show, setShow] = useState(false)

  const modalProps = useSpring({
    config: { mass: 0.75, tension: 300, friction: 20 },
    opacity: show ? 1 : 0,
    top: show ? num * 50 + 100 : -50,
    zIndex: num + 1
  })

  useEffect(() => {
    setShow(true)
    const showTimeout = setTimeout(() => setShow(false), 3000)
    const hideTimeout = setTimeout(() => onHide(id), 3200)
    return () => {
      clearTimeout(showTimeout)
      clearTimeout(hideTimeout)
      onHide(id)
    }
  }, [])

  return (
    <animated.div className="d-toast" style={modalProps}>
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path
          fill="#0077F5"
          fillRule="evenodd"
          d="M6.27 10.087L3.647 7.541l1.083-1.084L6.271 7.92l3.292-3.374 1.083 1.084-4.375 4.458zM7 0C3.134 0 0 3.134 0 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"
        />
      </svg>
      {message}
    </animated.div>
  )
}

export default Toaster

require('react-styl')(`
  .d-toast
    position: fixed
    left: 50%
    transform: translateX(-50%)
    display: flex
    align-items: center
    border: 1px solid #ffda26
    background-color: #fff7d6
    color: #000
    padding: 0.25rem 0.75rem
    border-radius: 5px
    font-size: 14px
    box-shadow: 0 0 10px 10px #fff
    svg
      margin-right: 0.5rem

`)
