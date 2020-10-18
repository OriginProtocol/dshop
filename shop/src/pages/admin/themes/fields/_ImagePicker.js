import React, { useRef, useReducer, useState } from 'react'
import fbt from 'fbt'
import get from 'lodash/get'
import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
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

const EditableProps = ({ imageObj, onChange, editableProps }) => {
  return (
    <>
      {editableProps.map((propName) => {
        const propVal = get(imageObj, propName)
        const onPropChange = (e) => {
          onChange({
            ...imageObj,
            [propName]: e.target.value
          })
        }

        const fieldProps = {
          className: 'form-control',
          value: propVal,
          onChange: onPropChange
        }

        const textInput = (label) => (
          <div key={propName} className="form-group">
            <label>{label}</label>
            <input type="text" {...fieldProps} />
          </div>
        )

        switch (propName) {
          case 'backgroundPosition':
            return (
              <div key={propName} className="form-group">
                <label>
                  <fbt desc="admin.themes.bgPos">Position</fbt>
                </label>
                <select {...fieldProps}>
                  <option value="center">
                    <fbt desc="Center">Center</fbt>
                  </option>
                  <option value="bottom">
                    <fbt desc="Bottom">Bottom</fbt>
                  </option>
                  <option value="left">
                    <fbt desc="Left">Left</fbt>
                  </option>
                  <option value="right">
                    <fbt desc="Right">Right</fbt>
                  </option>
                  <option value="top">
                    <fbt desc="Top">Top</fbt>
                  </option>
                </select>
              </div>
            )
          case 'height':
            return textInput(<fbt desc="admin.themes.height">Height</fbt>)
          case 'backgroundSize':
            return textInput(
              <fbt desc="admin.themes.bgSize">Background Size</fbt>
            )
        }

        return null
      })}
    </>
  )
}

const ImagePicker = ({ images, onChange, multiple, editableProps }) => {
  const { config } = useConfig()
  const { postRaw } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, {})

  const uploadRef = useRef()
  const uniqueId = useRef('upload_' + Date.now())

  const [editProps, setEditProps] = useState(null)

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

      const response = await postRaw(`/themes/upload-images`, {
        body: formData
      })
      return response.uploadedFiles
    } catch (error) {
      console.error('Could not upload images', error)
    }

    return []
  }

  const filesAdded = async (files, replaceAtIndex) => {
    setState({ uploading: true })
    let newImages = await uploadImages(files)
    newImages = newImages.map((image) => ({
      url: image.path,
      name: image.name
    }))
    setState({ uploading: false })

    if (typeof replaceAtIndex === 'number') {
      const newState = [...images]
      newState[replaceAtIndex] = newImages[0]
      onChange(newState)
    } else {
      onChange([...images, ...newImages].slice(0, 50))
    }
    uploadRef.current.value = ''
  }

  return (
    <div className="theme-editor-image-picker">
      {images.length ? (
        images.map((imageObj, index) => (
          <div className="image-box" key={imageObj.url}>
            <img src={config.dataSrc + imageObj.url} />
            <div className="label-section">
              <div className="label">{imageObj.name}</div>

              <div
                className="action-icon"
                onClick={() => {
                  setEditProps(editProps === index ? null : index)
                }}
              >
                <img src="/images/edit-icon.svg" />
              </div>
              <div
                className="action-icon"
                onClick={() => {
                  const newState = [...images]
                  newState.splice(index, 1)
                  onChange(newState)
                }}
              >
                <img src="/images/delete-icon.svg" />
              </div>
            </div>
            <div className="props-section">
              {editProps !== index ? null : (
                <EditableProps
                  imageObj={imageObj}
                  onChange={(newObj) => {
                    const newImages = [...images]
                    newImages[index] = newObj
                    onChange(newImages)
                  }}
                  editableProps={editableProps}
                />
              )}
            </div>
          </div>
        ))
      ) : (
        <label htmlFor={uniqueId.current} className="empty-image-box">
          <img src="/images/upload-icon-gray.svg" />
          <div>Upload an image</div>
        </label>
      )}
      <input
        id={uniqueId.current}
        type="file"
        accept={acceptedFileTypes.join(',')}
        ref={uploadRef}
        multiple={multiple}
        disabled={state.uploading}
        onChange={async (e) => {
          const { files } = e.currentTarget
          await filesAdded(files)
        }}
        style={{ display: 'none' }}
      />
      {!multiple && images.length ? null : (
        <label
          htmlFor={uniqueId.current}
          className="btn btn-outline-primary add-button"
          disabled={state.uploading}
        >
          {state.uploading ? (
            <>
              <fbt desc="Uploading">Uploading</fbt>...
            </>
          ) : (
            <fbt desc="admin.themes.addImage">Add Image</fbt>
          )}
        </label>
      )}
    </div>
  )
}

export default ImagePicker

require('react-styl')(`
  .theme-editor-image-picker
    margin-bottom: 1rem
    display: flex
    flex-direction: column

    .image-box
      margin: 0.5rem 0
      > img
        object-fit: contain
        max-height: 155px
        width: 100%
        margin-bottom: 0.5rem
      .label-section
        display: flex
        align-items: center
        .label
          flex: 1
        .action-icon
          flex: auto 0 0
          padding: 0 0.5rem
          cursor: pointer
          margin: 0

    .empty-image-box
      height: 155px
      border-radius: 5px
      border: solid 1px #cdd7e0
      background-color: #fafbfc
      display: flex
      flex-direction: column
      align-items: center
      justify-content: center
      color: #8293a4
      margin: 0.5rem 0
      cursor: pointer

      img
        margin-bottom: 1rem

    .btn.btn-outline-primary.add-button
      margin: 0.5rem 0 1rem 0
      font-weight: normal
      border-radius: 25px
`)
