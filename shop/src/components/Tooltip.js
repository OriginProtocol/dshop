import React, { useState, useRef } from 'react'
import { createPopper } from '@popperjs/core'
import { useEffect } from 'react'

const Tooltip = ({ text, children, placement }) => {
  const [open, setOpen] = useState(false)
  const [popper, setPopper] = useState()

  const btn = useRef()
  const popover = useRef()
  const arrow = useRef()

  useEffect(() => {
    if (open) {
      const instance = createPopper(btn.current, popover.current, {
        placement: placement || 'right',
        modifiers: [
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'arrow', options: { element: arrow.current } },
          {
            enabled: true,
            phase: 'beforeWrite',
            fn({ state }) {
              state.styles.popper.visibility = 'visible'
            }
          }
        ]
      })
      setPopper(instance)
    } else if (popper) {
      popper.destroy()
    }
    return () => {
      if (popper) {
        popper.destroy()
      }
    }
  }, [open, popover, placement])

  const el = React.cloneElement(children, {
    ref: btn,
    onMouseOver: () => setOpen(true),
    onMouseOut: () => setOpen(false)
  })

  return (
    <>
      {el}
      {!open ? null : (
        <div
          ref={popover}
          className="popover bs-popover-right m-0 popover-tooltip"
        >
          <div ref={arrow} className="arrow"></div>
          {text}
        </div>
      )}
    </>
  )
}

export default Tooltip

require('react-styl')(`
  .popover-tooltip
    visibility: hidden
    color: #333
    padding: 1rem
`)
