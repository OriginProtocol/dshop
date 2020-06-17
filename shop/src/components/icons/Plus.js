import React from 'react'

const Plus = ({ className = '' }) => (
  <svg className={`icon icon-plus ${className}`} width="12" height="12">
    <line x1="0" x2="12" y1="6" y2="6" strokeWidth="2" />
    <line x1="6" x2="6" y1="0" y2="12" strokeWidth="2" />
  </svg>
)

export default Plus

require('react-styl')(`
  .icon.icon-plus
    line
      stroke: #3b80ee
  .btn:hover .icon.icon-plus
    line
      stroke: #fff
`)
