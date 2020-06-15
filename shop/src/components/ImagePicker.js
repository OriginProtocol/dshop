import React, { useState, useEffect, useRef } from 'react'

import useConfig from 'utils/useConfig'

const acceptedFileTypes = [
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp'
]

const ImagePicker = (props) => {
  const { onChange } = props
  const [state, _setState] = useState({})
  const setState = (newState) => _setState({ ...state, ...newState })

  const { config } = useConfig()

  const uploadRef = useRef()

  useEffect(() => {
    setState({
      images: props.images || []
    })
  }, [props.images])

  const uploadImages = async (files) => {
    try {
      const formData = new FormData()

      for (const file of files) {
        formData.append('file', file)
      }

      const resp = await fetch(`/products/upload-images`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `bearer ${config.backendAuthToken}`
        }
      })

      const jsonResp = await resp.json()

      return jsonResp.uploadedFiles
    } catch (error) {
      console.error('Could not upload images', error)
    }

    return []
  }

  const renderPreview = () => {
    const images = [...(state.images || [])]
    if (images.length === 0) return null

    const { dragging, dragTarget } = state

    if (typeof dragging === 'number' && typeof dragTarget === 'number') {
      images.splice(dragging, 1)
      images.splice(dragTarget, 0, state.images[dragging])
    }

    return images.map((image, idx) => (
      <div
        key={idx}
        className={`preview-row${dragTarget === idx ? ' dragging' : ''}`}
        draggable
        onDragEnd={() => {
          setState({ dragging: null, dragTarget: null })
          onChange(images)
        }}
        onDragEnter={() => setState({ dragTarget: idx })}
        onDragOver={(e) => e.preventDefault()}
        onDragStart={(e) => {
          if (e.target.className.match(/preview-row/)) {
            setTimeout(() => setState({ dragging: idx }))
          } else {
            e.preventDefault()
          }
        }}
      >
        <div className="img" style={{ backgroundImage: `url(${image.src})` }} />
        <div className="info">
          <a
            href="#"
            title="Remove"
            onClick={(e) => {
              e.preventDefault()
              onChange(images.filter((i, offset) => idx !== offset))
            }}
            children={<>&times;</>}
          />
        </div>
      </div>
    ))
  }

  return (
    <div className="image-picker">
      {renderPreview()}
      <label htmlFor="upload">
        {state.open ? null : (
          <input
            id="upload"
            type="file"
            accept={acceptedFileTypes.join(',')}
            ref={uploadRef}
            multiple={true}
            onChange={async (e) => {
              const { files } = e.currentTarget
              setState({ uploading: true })
              let newImages = await uploadImages(files)
              newImages = newImages.map((image) => ({
                src: image.path,
                path: image.path
              }))
              setState({ uploading: false })
              onChange([...state.images, ...newImages].slice(0, 50))
              uploadRef.current.value = ''
            }}
            style={{ display: 'none' }}
          />
        )}
        <div className={`add-photos${state.uploading ? ' uploading' : ''}`} />
      </label>
    </div>
  )
}

export default ImagePicker

require('react-styl')(`
  .image-picker
    margin-bottom: 1rem
    display: flex
    flex-wrap: wrap
    justify-content: center
    > label
      cursor: pointer
      margin: 0
    .preview-row
      display: flex
      justofy-content: center
      margin: 0.5rem
      min-width: 9rem
      min-height: 9rem
      position: relative
      background: var(--white)
      cursor: move
      border: 2px dashed transparent
      border: 1px solid var(--light)
      border-radius: 10px
      overflow: hidden
      .info
        position: absolute
        top: 0
        right: 0
        background: rgba(255, 255, 255, 0.75)
        line-height: normal
        border-radius: 0 0 0 2px
        > a
          padding: 0 0.25rem
          font-weight: bold
          color: var(--dusk)
          &.crop
            opacity: 0.6;
            &::after
              content: ""
              width: 12px;
              height: 12px
              background: url(images/crop.svg) no-repeat center
              vertical-align: 0px;
              background-size: contain
              display: inline-block
            &:hover
              opacity: 1
          &:hover
            color: #000
            background: rgba(255, 255, 255, 0.85)
      .img
        background-position: center
        width: 100%
        padding-top: 75%
        background-size: contain
        background-repeat: no-repeat

      &.dragging
        .info
          visibility: hidden
        .img
          visibility: hidden
        border: 1px dashed var(--light-dusk)

    .add-photos
      margin: 0.5rem
      border: 1px solid var(--light)
      border-radius: 10px
      overflow: hidden
      font-size: 14px
      font-weight: normal
      color: var(--bluey-grey)
      min-height: 9rem
      min-width: 9rem
      display: flex
      align-items: center
      justify-content: center
      flex-direction: column

      &::before
        content: ""
        background: url(images/add-icon.svg) no-repeat
        width: 2.5rem
        height: 2.5rem
        background-size: contain
        background-position: center
      &:hover::before
        opacity: 0.75

      &.uploading::before
        background: url(images/spinner-animation-dark.svg) no-repeat
`)
