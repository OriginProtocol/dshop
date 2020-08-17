import React, { useState, useRef } from 'react'
import fbt from 'fbt'

const UploadIcon = () => (
  <svg width="38" height="47" viewBox="0 0 38 47">
    <path
      fill="#3B80EE"
      d="M27.162 35.863V19.291H38L19 0 0 19.29h10.838v16.573h16.324zM38 47v-5.568H0V47h38z"
    />
  </svg>
)

const UploadFile = ({ replace, accept, onUpload = () => {} }) => {
  const [isDrop, setDrop] = useState()
  const logoRef = useRef()

  function upload(files) {
    const body = new FormData()
    for (const file of files) {
      body.append('file', file)
    }
    onUpload(body)
  }

  return (
    <div
      className={`upload-file${isDrop ? ' dropping' : ''}`}
      onDragEnter={(e) => {
        if (e.dataTransfer.items.length === 0) return
        e.preventDefault()
        e.stopPropagation()
        if (e.currentTarget.matches('.upload-file, .upload-file *')) {
          clearTimeout(window.__dragLeaveTimeout)
          setDrop(true)
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.matches('.upload-file *')) return

        e.preventDefault()
        e.stopPropagation()

        window.__dragLeaveTimeout = setTimeout(() => {
          setDrop(false)
        }, 300)
      }}
      onDrop={async (e) => {
        if (e.dataTransfer.items.length === 0) return
        e.preventDefault()
        e.stopPropagation()

        setDrop(false)

        const files = Array.from(e.dataTransfer.items).map((x) => x.getAsFile())
        upload(files)
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
      <UploadIcon />
      <input
        type="file"
        ref={logoRef}
        className="form-control d-none"
        accept={accept}
        onChange={(e) => upload(e.target.files)}
      />
      <button
        type="button"
        className={`btn btn-${
          isDrop ? 'link' : 'outline-primary'
        } btn-rounded px-4`}
        onClick={() => logoRef.current.click()}
      >
        {isDrop ? (
          <fbt desc="admin.settings.general.dropFileHere">Drop File Here</fbt>
        ) : (
          `${
            replace ? (
              <fbt desc="admin.settings.general.replaceImage">
                Replace Image
              </fbt>
            ) : (
              <fbt desc="admin.settings.general.replaceImage">Add Image</fbt>
            )
          }`
        )}
      </button>
    </div>
  )
}

export default UploadFile

require('react-styl')(`
  .upload-file
    border: 1px dashed #3b80ee
    background-color: #f8fbff
    flex-direction: column
    height: 175px
    display: flex
    align-items: center
    justify-content: center
    border-radius: 5px
    max-width: 650px
    &.dropping
      border-color: #eee53b
      background-color: #fffff8
    svg
      margin-bottom: 1.5rem
`)
