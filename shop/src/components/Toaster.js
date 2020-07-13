import React, { useReducer, useState, useEffect, useRef } from 'react'
import { useSpring, animated } from 'react-spring'
import { createPortal } from 'react-dom'

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

const Toast = ({ id, num, message, onHide, type = 'success' }) => {
  const [show, setShow] = useState(false)

  const modalProps = useSpring({
    config: { mass: 0.75, tension: 300, friction: 20 },
    opacity: show ? 1 : 0,
    top: show ? num * 50 + 20 : -50,
    zIndex: num + 1100
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

  const el = useRef(document.createElement('div'))

  useEffect(() => {
    document.body.appendChild(el.current)
    el.current.classList.add('d-toaster')

    return () => {
      if (el.current.parentElement) {
        el.current.parentElement.removeChild(el.current)
      }
    }
  }, [el])

  const cmp = (
    <animated.div className={`d-toast ${type}`} style={modalProps}>
      {type === 'error' ? (
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path
            fill="#D50000"
            fillRule="evenodd"
            d="M9.123 4l.858.858-2.121 2.14L10 9.113l-.859.858L7.01 7.857 4.899 10l-.852-.851 2.105-2.14L4 4.925l.85-.85L7 6.15 9.122 4zM7 0C3.134 0 0 3.134 0 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path
            fill="#0077F5"
            fillRule="evenodd"
            d="M6.27 10.087L3.647 7.541l1.083-1.084L6.271 7.92l3.292-3.374 1.083 1.084-4.375 4.458zM7 0C3.134 0 0 3.134 0 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"
          />
        </svg>
      )}
      {message}
    </animated.div>
  )

  return createPortal(cmp, el.current)
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
    &.error
      background-color: #ffe8e8
      border-color: #d50000
    svg
      margin-right: 0.5rem

  .d-toaster
    z-index: 1050

`)
