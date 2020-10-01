import React, { useRef, useEffect, useContext, useReducer } from 'react'
import debounce from 'lodash/debounce'

import './Gallery.css'

export const Context = React.createContext()
const reducer = (state, newState) => ({ ...state, ...newState })

export const Provider = ({ children, images, active = 0, onChange }) => {
  const stateReducer = useReducer(reducer, {
    active,
    images,
    scrollEl: useRef(null),
    thumbnailsEl: useRef(null)
  })

  useEffect(() => {
    stateReducer[1]({ active })
  }, [active])

  useEffect(() => {
    if (onChange) {
      onChange(stateReducer[0].active)
    }
  }, [stateReducer[0].active])

  return <Context.Provider value={stateReducer}>{children}</Context.Provider>
}

export const Thumbnails = ({ className, children }) => {
  const [{ thumbnailsEl, active }] = useContext(Context)
  useEffect(() => {
    if (!thumbnailsEl || !thumbnailsEl.current) return
    const img = thumbnailsEl.current.querySelector(
      `img:nth-child(${active + 1})`
    )
    const left =
      img.offsetLeft -
      thumbnailsEl.current.clientWidth / 2 +
      img.clientWidth / 2
    thumbnailsEl.current.scrollTo({ left, behavior: 'smooth' })
  }, [thumbnailsEl, active])

  return (
    <div className={className} ref={thumbnailsEl}>
      {children}
    </div>
  )
}

export const Scroll = ({ style = {} }) => {
  const [{ scrollEl, images, active }, setState] = useContext(Context)
  if (!images.length) return null

  // Set the active image once the scroll is finished
  useEffect(() => {
    const el = scrollEl.current
    const handleScroll = debounce(() => {
      const pct = el.scrollLeft / (el.scrollWidth - el.clientWidth)
      setState({ active: Math.round(pct * (images.length - 1)) })
    }, 100)
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollEl.current])

  // Set scroll offset to active image when we first render
  useEffect(() => {
    if (active) {
      const width = scrollEl.current.clientWidth
      scrollEl.current.scrollTo(width * active, 0)
    }
  }, [])

  return (
    <div className="gallery-scroll-wrap">
      <div ref={scrollEl} className="gallery-scroll" style={style}>
        {images.map((pic, idx) => {
          const picStyle = { backgroundImage: `url(${pic})`, ...style }
          return <div key={idx} style={picStyle} />
        })}
      </div>
    </div>
  )
}
