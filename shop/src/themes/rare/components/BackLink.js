import React from 'react'
import { Link } from 'react-router-dom'

const BackLink = ({ to, className = '' }) => {
  return (
    <Link to={to} className={`hover:opacity-75 ${className}`}>
      <svg width="16" height="16">
        <g stroke="#000" strokeWidth="2" strokeLinecap="round">
          <line x1="8" y1="1" x2="1" y2="8" />
          <line x1="1" y1="8" x2="8" y2="15" />
          <line x1="2" y1="8" x2="15" y2="8" />
        </g>
      </svg>
    </Link>
  )
}

export default BackLink
