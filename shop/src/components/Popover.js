import React, { useState, useRef } from 'react'
import { createPopper } from '@popperjs/core'
import { useEffect } from 'react'

const Popover = ({
  button,
  children,
  className,
  onClose = () => {},
  onOpen = () => {},
  el = 'button',
  contentClassName = 'popover bs-popover-bottom m-0',
  shouldClose,
  placement = 'bottom',
  arrow = true
}) => {
  const [open, setOpen] = useState(false)
  const [popper, setPopper] = useState()

  const btn = useRef()
  const popover = useRef()
  const arrowRef = useRef()
  const El = el

  useEffect(() => {
    const listener = (event) => {
      if (!popover.current || popover.current.contains(event.target)) {
        return
      }
      if (!btn.current || btn.current.contains(event.target)) {
        return
      }
      setOpen(false)
      onClose()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [])

  useEffect(() => {
    if (open) {
      const modifiers = [
        { name: 'offset', options: { offset: [0, 8] } },
        {
          enabled: true,
          phase: 'beforeWrite',
          fn: ({ state }) => {
            state.styles.popper.visibility = 'visible'
          }
        }
      ]
      if (arrow) {
        const options = { element: arrowRef.current }
        modifiers.push({ name: 'arrow', options })
      }
      const opts = { placement, modifiers }
      const instance = createPopper(btn.current, popover.current, opts)
      setPopper(instance)
    } else if (popper) {
      popper.destroy()
    }
    return () => {
      if (popper) {
        popper.destroy()
      }
    }
  }, [open, popover])

  useEffect(() => {
    if (shouldClose) {
      setOpen(false)
    }
  }, [shouldClose])

  return (
    <>
      <El
        ref={btn}
        className={className}
        onClick={() => {
          setOpen(!open)
          open ? onClose() : onOpen()
        }}
      >
        {button}
      </El>
      {!open ? null : (
        <div
          ref={popover}
          className={contentClassName}
          style={{ visibility: 'hidden' }}
        >
          {arrow ? <div ref={arrowRef} className="arrow" /> : null}
          {children}
        </div>
      )}
    </>
  )
}

export default Popover

require('react-styl')(`
  .popover
    box-shadow: 0 2px 14px 0 rgba(0, 0, 0, 0.5)
    padding: 0.5rem
`)
