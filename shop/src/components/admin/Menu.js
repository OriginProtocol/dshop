import React from 'react'

const Menu = ({ children }) => {
  return <ul className="admin-menu list-unstyled">{children}</ul>
}

export default Menu

require('react-styl')(`
  .admin-menu
    background-color: #f8f8f8
    padding: 0.875rem 0
    height: 100%
    border-right: 1px solid #e9f0f3
    li
      margin: 0.5rem 0
      a
        display: flex
        align-items: center
        padding: 0.75rem 0.5rem 0.75rem 1rem
        color: #666
        line-height: 0
        svg
          margin-right: 0.5rem
          fill: #8293a4
          display: inline-block
          min-width: 20px
      &.active a
        color: #000
        svg
          fill: #3B80EE

    .back-link
      font-size: 0.875rem
      margin-bottom: 0.5rem
      margin-left: 5px

`)
