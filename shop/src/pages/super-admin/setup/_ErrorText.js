import React from 'react'

const ErrorText = ({ children }) => {
  if (!children) return null

  return (
    <div className="admin-error-text">
      <img src="images/error-icon.svg" />
      {children}
    </div>
  )
}

export default ErrorText

require('react-styl')(`
  .admin-error-text
    display: flex
    align-items: center
    color: #fff
    font-size: 0.875rem
    margin: 0.5rem 0

    img
      height: 20px
      width: 20px
      object-fit: contain
      margin-right: 10px

`)
