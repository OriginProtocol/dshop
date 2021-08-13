import React from 'react'
import { Link } from 'react-router-dom'

const Button = ({ to, disabled, className = 'btn', children }) => {
  if (disabled) {
    return <div className="btn-disabled">{children}</div>
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

export default Button
