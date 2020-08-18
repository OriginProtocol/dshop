import React from 'react'

const Menu = ({ children }) => {
  return <ul className="admin-menu list-unstyled">{children}</ul>
}

export default Menu

require('react-styl')(`
  .admin-menu
    display: flex
    flex-direction: column
    background-color: #f8f8f8
    padding: 0.875rem 0
    height: 100%
    border-right: 1px solid #e9f0f3
    margin-bottom: 0
    li
      margin-top: 0.5rem
      a
        display: flex
        align-items: center
        padding-left: 1.25rem
        min-height: 2.25rem
        color: #8293a4
        line-height: 0
        > svg
          margin-right: 0.5rem
          fill: #8293a4
          display: inline-block
          min-width: 20px
        .caret
          display: flex
          align-self: normal
          align-items: center
          margin-left: auto
          padding-left: 1rem
          padding-right: 1rem
          cursor: pointer
          > svg
            fill: #8293a4
      .sub-menu li
        position: relative
        a
          padding-left: 4rem
          min-height: 1.75rem
        &.active a:before
          content: ""
          position: absolute
          height: 17px
          width: 4px
          background-color: #1a82ff
          transform: translateX(-15px)

      &.active > a
        color: #000
        svg
          fill: #3B80EE

    .back-link
      font-size: 0.875rem
      margin-bottom: 0.5rem
      margin-left: 5px

`)
