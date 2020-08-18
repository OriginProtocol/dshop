import React, { useEffect, useRef, useReducer, useMemo } from 'react'
import get from 'lodash/get'
import fbt, { FbtParam } from 'fbt'
import useBackendApi from 'utils/useBackendApi'
import useConfig from 'utils/useConfig'
import loadImage from 'utils/loadImage'

const acceptedFileTypes = [
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp'
]

function reducer(state, newState) {
  return { ...state, ...newState }
}

const PreviewImages = (props) => {
  const {
    dragging,
    dragTarget,
    onChange,
    onDragStateChange,
    disabled,
    backend
  } = props

  const images = useMemo(() => {
    const a = [...(props.images || [])]

    if (typeof dragging === 'number' && typeof dragTarget === 'number') {
      a.splice(dragging, 1)
      a.splice(dragTarget, 0, props.images[dragging])
    }

    return a
  }, [props.images, dragging, dragTarget])

  if (images.length === 0) return null

  return images.map((image, idx) => {
    let eventProps = {
      className: 'preview-row disabled'
    }

    if (!disabled) {
      eventProps = {
        className: `preview-row${dragTarget === idx ? ' dragging' : ''}`,
        draggable: true,
        onDragEnd: (e) => {
          if (e.dataTransfer.items.length > 0) return
          onDragStateChange({ dragging: null, dragTarget: null })
          onChange(images)
        },
        onDragEnter: (e) => {
          if (e.dataTransfer.items.length > 0) return
          onDragStateChange({ dragTarget: idx })
        },
        onDragOver: (e) => {
          if (e.dataTransfer.items.length > 0) return
          e.preventDefault()
        },
        onDragStart: (e) => {
          if (e.dataTransfer.items.length > 0) return
          if (e.target.className.match(/preview-row/)) {
            setTimeout(() => onDragStateChange({ dragging: idx }))
          } else {
            e.preventDefault()
          }
        }
      }
    }

    return (
      <div key={image.src} {...eventProps}>
        <div
          className="img"
          style={{ backgroundImage: `url(${backend}${image.src})` }}
        />
        <div className="info">
          <div className="img-title">{image.name || image.path}</div>
          <div className="img-subtitle">
            {idx === 0 ? (
              <fbt desc="component.ImagePicker.coverImage">Cover image</fbt>
            ) : (
              <fbt desc="component.ImagePicker">
                Image <FbtParam name="index">{idx}</FbtParam>
              </fbt>
            )}
          </div>
        </div>
        <div className="actions">
          {disabled ? null : (
            <a
              href="#"
              title={fbt('Remove', 'Remove')}
              onClick={(e) => {
                e.preventDefault()
                onChange(images.filter((i, offset) => idx !== offset))
              }}
              children={<>&times;</>}
            />
          )}
        </div>
      </div>
    )
  })
}

const ImagePicker = (props) => {
  const { onChange, disabled, children, maxImages } = props
  const [state, setState] = useReducer(reducer, {})
  const { config } = useConfig()

  const { postRaw } = useBackendApi({ authToken: true })

  const uploadRef = useRef()

  useEffect(() => {
    setState({ images: props.images || [] })
  }, [props.images])

  const uploadImages = async (files) => {
    try {
      const formData = new FormData()

      for (const file of files) {
        const processedFile = await new Promise((resolve) => {
          loadImage(
            file,
            (img) => {
              return img.toBlob((blob) => resolve(blob), 'image/jpeg')
            },
            {
              orientation: true,
              maxWidth: 2000,
              maxHeight: 2000,
              canvas: true
            }
          )
        })
        formData.append('file', processedFile)
      }

      const body = formData
      const response = await postRaw(`/products/upload-images`, { body })
      return response.uploadedFiles
    } catch (error) {
      console.error('Could not upload images', error)
    }

    return []
  }

  const filesAdded = async (files) => {
    setState({ uploading: true })
    let newImages = await uploadImages(files)
    newImages = newImages.map((image) => ({
      src: image.path,
      path: image.path,
      name: image.name
    }))
    setState({ uploading: false })
    onChange([...state.images, ...newImages].slice(0, 50))
    uploadRef.current.value = ''
  }

  const imgLength = get(state, 'images.length', 0)
  const hasImages = imgLength > 0
  const canAddMoreImages = Number(maxImages) > 0 ? imgLength < maxImages : true

  if (disabled) {
    return (
      <div className="image-picker">
        {!hasImages ? null : (
          <PreviewImages
            backend={config.backend}
            images={state.images}
            disabled={true}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className="image-picker"
      onDragEnter={(e) => {
        if (e.dataTransfer.items.length === 0) return
        e.preventDefault()
        e.stopPropagation()

        if (e.currentTarget.matches('.image-picker, .image-picker *')) {
          clearTimeout(window.__dragLeaveTimeout)
          setState({ externalDrop: true })
        }
      }}
      onDragLeave={(e) => {
        // if (e.dataTransfer.items.length === 0) return
        if (e.currentTarget.matches('.image-picker *')) return

        e.preventDefault()
        e.stopPropagation()

        window.__dragLeaveTimeout = setTimeout(() => {
          setState({ externalDrop: false })
        }, 300)
      }}
      onDrop={async (e) => {
        if (e.dataTransfer.items.length === 0) return
        e.preventDefault()
        e.stopPropagation()

        setState({ externalDrop: false })

        const files = Array.from(e.dataTransfer.items).map((x) => x.getAsFile())
        await filesAdded(files)
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.items.length === 0) return
        if (e.currentTarget.matches('.image-picker, .image-picker *')) {
          clearTimeout(window.__dragLeaveTimeout)
        }

        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {!hasImages ? null : (
        <PreviewImages
          backend={config.backend}
          images={state.images}
          dragging={state.dragging}
          dragTarget={state.dragTarget}
          onDragStateChange={setState}
          onChange={onChange}
        />
      )}
      <label htmlFor="upload" className={!hasImages ? 'empty-state' : ''}>
        {state.open ? null : (
          <input
            id="upload"
            type="file"
            accept={acceptedFileTypes.join(',')}
            ref={uploadRef}
            multiple={true}
            onChange={async (e) => {
              const { files } = e.currentTarget
              await filesAdded(files)
            }}
            style={{ display: 'none' }}
          />
        )}
        {!hasImages ? (
          <div className="add-first-photo">
            {children || (
              <>
                <div>
                  <fbt desc="component.ImagePicker.dragToUpload">
                    Drag files here to upload
                  </fbt>
                  <br />
                  <fbt desc="component.ImagePicker.selectFromPc">
                    or select a photo from your computer
                  </fbt>
                </div>
                <div className="btn btn-outline-primary">
                  <fbt desc="component.ImagePicker.selectPhoto">
                    Select photo
                  </fbt>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {!canAddMoreImages ? null : (
              <div
                className={`add-photos${state.uploading ? ' uploading' : ''}`}
              />
            )}
          </>
        )}
      </label>
      {!state.externalDrop ? null : (
        <div className="external-drop-hover">
          <h4>
            <fbt desc="component.ImagePicker.dropHere">Drop here to upload</fbt>
          </h4>
        </div>
      )}
    </div>
  )
}

export default ImagePicker

require('react-styl')(`
  .image-picker
    margin-bottom: 1rem
    display: flex
    flex-wrap: wrap

    border-radius: 5px
    border: dashed 1px #3b80ee
    background-color: #f8fbff

    padding: 10px

    position: relative

    > label
      cursor: pointer
      margin: 0
    .preview-row
      display: flex
      flex-direction: column
      justofy-content: center
      margin: 0.5rem
      width: 9rem
      height: 9rem

      position: relative
      background: var(--white)

      border-radius: 2px
      border: solid 1px #cdd7e0
      background-color: #ffffff
      padding: 10px

      &:not(.disabled)
        cursor: move

      .info
        font-size: 0.875rem
        color: #000
        width: 100%

        .img-subtitle, .img-title
          width: 100%
          overflow: hidden
          text-overflow: ellipsis
          white-space: nowrap
        .img-subtitle
          font-size: 0.75rem
          color: #8293a4

      .actions
        position: absolute
        top: -8px
        right: -8px
        background: rgba(255, 255, 255, 0.75)
        line-height: normal
        border-radius: 0 0 0 2px
        margin: 0
        > a
          height: 1rem
          width: 1rem
          display: flex
          align-items: center
          justify-content: center
          border-radius: 50%
          border: solid 1px #1c7ef6
          background-color: #3b80ee
          color: #fff
          font-size: 0.75rem
          line-height: 0
      .img
        background-position: center
        width: 100%
        padding-top: 75%
        background-size: contain
        background-repeat: no-repeat

      &.dragging
        .actions
          visibility: hidden
        .img
          visibility: hidden
        border: 1px dashed var(--light-dusk)

    .add-photos
      margin: 0.5rem
      overflow: hidden
      font-size: 14px
      font-weight: normal
      color: var(--bluey-grey)
      height: 9rem
      width: 9rem
      display: flex
      align-items: center
      justify-content: center
      flex-direction: column

      border-radius: 2px
      border: solid 1px #cdd7e0
      background-color: #ffffff

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

    .external-drop-hover
      position: absolute
      left: 0
      right: 0
      top: 0
      bottom: 0
      opacity: 0.9
      display: flex
      align-items: center
      justify-content: center
      background-color: #fff

    label.empty-state
      width: 100%

    .add-first-photo
      display: flex
      flex-direction: column
      justify-content: center
      align-items: center
      padding: 2rem

      text-align: center

      .btn
        border-radius: 17.5px
        margin-top: 1rem
`)
