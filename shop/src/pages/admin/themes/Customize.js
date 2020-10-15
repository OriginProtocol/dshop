import React, { useEffect, useState } from 'react'

import { useStateValue } from 'data/state'
import EditFields from './_EditFields'

const CustomizeTheme = () => {
  const [{ admin, config }] = useStateValue()

  const [isMobileMode, setIsMobileMode] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => (document.body.style.overflow = 'auto')
  }, [])

  const previewUrl = `${window.origin}/theme/${config.themeId}?shop=${config.backendAuthToken}`
  return (
    <div className="customize-theme sidebar-layout">
      <div className="sidebar-container d-flex flex-column">
        <EditFields />
      </div>
      <div className="main-content-container d-flex flex-column">
        <div className="customize-nav preview">
          <div className="action-icon" onClick={() => setIsMobileMode(!isMobileMode)}>
            <img src={`/images/${isMobileMode ? 'mobile' : 'desktop'}-icon.svg`} />
          </div>
          <div className="action-icon">
            <img src="/images/new-window-icon.svg" />
          </div>
        </div>
        <iframe 
          src={previewUrl} 
          style={{
            width: isMobileMode ? '340px' : '100%'
          }} 
        />
      </div>
    </div>
  )
}

export default CustomizeTheme

require('react-styl')(`
  .customize-theme
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    background-color: #fafbfc

    .sidebar-container
      border-right: 1px solid #e9f0f3
      width: 320px
    
    .customize-nav
      flex: auto 0 0
      min-height: 4.5rem
      display: flex
      align-items: center
      &.preview
        min-height: 0.75rem
        margin-bottom: 1.875rem
        .action-icon
          margin: 0 1rem
          cursor: pointer
          img
            height: 16px
            width: 16px
            object-fit: contain
          &:first-child
            margin-left: auto
    iframe
      border-radius: 5px
      box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1)
      border: solid 1px #d9e1e7
      flex: 1
      margin: 0 auto

`)
