import React from 'react'

const Select = ({ children }) => (
  <div className="relative">
    {children}
    <svg
      width="14"
      height="9"
      fill="none"
      className="absolute pointer-events-none"
      style={{ top: 'calc(50% - 4px)', right: '1rem' }}
    >
      <path d="M1 1L7 7L13 1" stroke="black" strokeWidth="2" />
    </svg>
  </div>
)

export default Select
