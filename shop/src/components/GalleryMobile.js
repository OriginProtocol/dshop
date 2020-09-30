import React, { useRef, useEffect, useContext, useReducer } from 'react'
import debounce from 'lodash/debounce'

import './GalleryMobile.css'

export const GalleryContext = React.createContext()
const reducer = (state, newState) => ({ ...state, ...newState })

export const GalleryProvider = ({ children }) => {
  const scrollEl = useRef(null)
  const value = useReducer(reducer, { active: 0, scrollEl })
  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  )
}

export const GalleryMobile = ({ pics = [], forceOffset = 0, style = {} }) => {
  if (!pics.length) return null

  const [{ scrollEl, offset }, setState] = useContext(GalleryContext)

  useEffect(() => {
    const el = scrollEl.current
    const handleScroll = debounce(() => {
      const pct = el.scrollLeft / (el.scrollWidth - el.clientWidth)
      setState({ active: Math.round(pct * (pics.length - 1)) })
    }, 100)
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollEl.current])

  useEffect(() => {
    const width = scrollEl.current.clientWidth
    scrollEl.current.scrollTo(width * offset, 0)
  }, [forceOffset])

  return (
    <div className="gallery-scroll-wrap">
      <div ref={scrollEl} className="gallery-scroll" style={style}>
        {pics.map((pic, idx) => {
          const picStyle = { backgroundImage: `url(${pic})`, ...style }
          return <div key={idx} style={picStyle} />
        })}
      </div>
    </div>
  )
}
