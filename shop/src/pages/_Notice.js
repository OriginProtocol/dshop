import React from 'react'

import useConfig from 'utils/useConfig'

const Notice = () => {
  const { config } = useConfig()
  if (!config.notice) {
    return null
  }
  return (
    <div className="notice-banner">
      <div
        className="container"
        dangerouslySetInnerHTML={{ __html: config.notice }}
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
    border-top: 5px solid black
    border-bottom: 1px solid black
`)
