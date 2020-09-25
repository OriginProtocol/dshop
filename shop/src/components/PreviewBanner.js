import React from 'react'
import fbt from 'fbt'

const PreviewBanner = ({
  wrapperClassName = 'shop-preview-banner',
  className = 'container px-4'
}) => {
  if (window.name !== 'shop_preview') {
    return null
  }
  return (
    <div className={wrapperClassName}>
      <div className={className}>
        <div>
          <fbt desc="component.PreviewBanner.desc">
            You’re previewing this shop, close this window when you’re done.
          </fbt>
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            window.close()
          }}
        >
          <fbt desc="component.PreviewBanner.closeWindow">Close window</fbt>
        </a>
      </div>
    </div>
  )
}

export default PreviewBanner

require('react-styl')(`
  .shop-preview-banner
    background-color: #000000

    .container
      padding: 1.125rem 0
      color: #ffffff
      font-size: 0.875rem
      display: flex
      align-items: center
      justify-content: space-between

      a
        color: #f8f8f8
        font-size: 0.875rem
        text-decoration: underline
        &:hover
          color: #fff

`)
