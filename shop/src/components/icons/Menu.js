import React from 'react'

const Menu = ({ className = '', color = '#000' }) => (
  <svg className={`${className}`} width="20" height="18" viewBox="0 0 20 18">
    <line x1="0" y1="16" x2="20" y2="16" strokeWidth="3" stroke={color} />
    <line x1="0" y1="9" x2="20" y2="9" strokeWidth="3" stroke={color} />
    <line x1="0" y1="2" x2="20" y2="2" strokeWidth="3" stroke={color} />
  </svg>
)

export default Menu
