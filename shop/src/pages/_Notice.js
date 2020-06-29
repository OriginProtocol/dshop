import React from 'react'

import useConfig from 'utils/useConfig'

const Notice = ({ footer }) => {
  const { config } = useConfig()
  if (footer && !config.noticeFooter) {
    return null
  }
  if (!config.notice) {
    return null
  }
  return (
    <div
      className={`notice-banner ${footer ? 'notice-footer' : 'notice-header'}`}
    >
      <div
        className="container"
        dangerouslySetInnerHTML={{
          __html: footer ? config.noticeFooter : config.notice
        }}
      />
    </div>
  )
}

export default Notice

require('react-styl')(`
  .notice-banner
    background: #ff2000
    color: white
    text-align: center
    padding: 0.5rem
    &.notice-header
      border-top: 5px solid black
      border-bottom: 1px solid black
    &.notice-footer
      border-top: 1px solid black
      border-bottom: 1px solid black
      margin-top: 4rem
      margin-bottom: -4rem
`)
