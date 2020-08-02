import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSpring, animated } from 'react-spring'

const Modal = ({ children, onClose, className, shouldClose }) => {
  const [show, setShow] = useState(false)
  const [shouldCloseInt, setShouldCloseInt] = useState(false)

  const bgProps = useSpring({
    config: { duration: 150 },
    opacity: show ? 0.7 : 0
  })

  const modalProps = useSpring({
    config: { mass: 0.75, tension: 300, friction: 20 },
    opacity: show ? 1 : 0,
    transform: show ? 'translate3d(0px,0,0)' : 'translate3d(0,-100px,0)'
  })

  const el = useRef(document.createElement('div'))

  function doClose() {
    setShow(false)
    return setTimeout(onClose, 150)
  }

  useEffect(() => {
    document.body.appendChild(el.current)
    document.getElementById('app').style.filter = 'blur(2px)'
    function onKeyDown(e) {
      // Esc
      if (e.keyCode === 27) {
        doClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    setShow(true)
    return () => {
      document.getElementById('app').style.filter = ''
      document.removeEventListener('keydown', onKeyDown)
      el.current.parentElement.removeChild(el.current)
    }
  }, [el])

  useEffect(() => {
    let timeout
    if (shouldClose || shouldCloseInt) {
      timeout = doClose()
    }
    return () => clearTimeout(timeout)
  }, [el, shouldClose, shouldCloseInt])

  const cmp = (
    <>
      <animated.div className="modal-backdrop" style={bgProps} />
      <animated.div
        className="modal d-block"
        tabIndex="-1"
        style={modalProps}
        onMouseDown={() => setShouldCloseInt(true)}
      >
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className={`modal-dialog modal-dialog-centered ${className || ''}`}
          role="document"
        >
          <div className="modal-content">{children}</div>
        </div>
      </animated.div>
    </>
  )

  return createPortal(cmp, el.current)
}

export default Modal

require('react-styl')(`
  .modal-backdrop
    background-color: #fff
  .modal-content .text-lg
    font-size: 28px
    line-height: normal
  .modal-content .actions
    margin-top: 2rem
  .modal-content .action-buttons
    margin-top: 2rem
    display: flex
    justify-content: flex-end
    > div
      display: grid
      grid-auto-columns: 1fr
      grid-auto-flow: column
      column-gap: 0.75rem
      .btn
        padding-left: 1.5rem
        padding-right: 1.5rem
`)
