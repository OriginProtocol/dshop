import React, { useState, useContext } from 'react'

import useIsMobile from 'utils/useIsMobile'
import * as Gallery from 'components/Gallery'

const GalleryChooser = ({ product, active, onChange }) => {
  const isMobile = useIsMobile()
  return (
    <Gallery.Provider
      images={product.imageUrls}
      active={active}
      onChange={onChange}
    >
      {isMobile ? (
        <>
          <Gallery.Scroll />
          <Ticks />
        </>
      ) : (
        <>
          <ActiveImage />
          <Thumbnails />
        </>
      )}
    </Gallery.Provider>
  )
}

const Ticks = () => {
  const [{ active, scrollEl, images }] = useContext(Gallery.Context)
  if (images.length <= 1) return null
  return (
    <div className="grid grid-flow-col gap-2 justify-center">
      {images.map((pic, idx) => (
        <div
          key={idx}
          className={`w-2 h-2 border border-black${
            active === idx ? ' bg-black' : ''
          }`}
          onClick={() => {
            const width = scrollEl.current.clientWidth
            scrollEl.current.scrollTo(width * idx, 0)
          }}
        />
      ))}
    </div>
  )
}

const Thumbnails = () => {
  const [{ active, images }, setState] = useContext(Gallery.Context)
  if (images.length <= 1) return null

  return (
    <Gallery.Thumbnails className="overflow-auto relative flex">
      <div className="grid grid-flow-col gap-2 mt-6 min-w-0 mx-auto">
        {images.map((pic, idx) => {
          const isActive = idx === active ? '' : ' opacity-50 hover:opacity-100'
          return (
            <img
              key={idx}
              className={`cursor-pointer transition-opacity duration-100${isActive}`}
              src={pic}
              style={{ maxWidth: 50 }}
              onClick={() => setState({ active: idx })}
            />
          )
        })}
      </div>
    </Gallery.Thumbnails>
  )
}

const ActiveImage = () => {
  const [over, setOver] = useState('0')
  const [{ images, active }, setState] = useContext(Gallery.Context)
  return (
    <div
      className="relative"
      onMouseOver={() => setOver('50')}
      onMouseOut={() => setOver('0')}
    >
      {images.length <= 1 ? null : (
        <>
          <div
            className={`w-16 h-16 opacity-${over} absolute z-10 bg-no-repeat bg-center hover:opacity-100 cursor-pointer bg-contain transition-opacity duration-100`}
            style={{
              backgroundImage: 'url(images/left-arrow-large.svg)',
              top: 'calc(50% - 2rem)'
            }}
            onClick={() => {
              setState({
                active: active === 0 ? images.length - 1 : active - 1
              })
            }}
          />
          <div
            className={`w-16 h-16 opacity-${over} absolute z-10 bg-no-repeat bg-center hover:opacity-100 cursor-pointer bg-contain transition-opacity duration-100`}
            style={{
              backgroundImage: 'url(images/right-arrow-large.svg)',
              top: 'calc(50% - 2rem)',
              right: 0
            }}
            onClick={() => {
              setState({
                active: active === images.length - 1 ? 0 : active + 1
              })
            }}
          />
        </>
      )}
      <img src={images[active]} />
    </div>
  )
}

export default GalleryChooser
