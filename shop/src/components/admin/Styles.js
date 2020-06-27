/*
  Styles
*/

require('react-styl')(`
  .admin
    -webkit-font-smoothing: antialiased
    min-height: 100vh
    display: flex
    flex-direction: column

    h1,h2,h3
      color: #000
    h1
      font-size: 24px
    .fullwidth-container
      width: 100%
      flex: 1
      padding: 0 1.125rem
      .row
        margin: 0

    .flex-1
      flex: 1
    nav
      border-bottom: 1px solid #dfe2e6
      color: #000
      > .fullwidth-container
        display: flex
        align-items: center
        justify-content: between
        flex-wrap: wrap
        min-height: 4.5rem
      h1
        margin: 0
        display: flex
        flex: 1
        font-size: 1rem
        img
          max-height: 2.5rem
          max-width: 12rem
          &.dshop-logo
            transform: translateY(3.5px)
        .shops-title-wrapper
          display: flex
        .shop-title
          display: flex
          align-items: center
          margin-left: 1rem
          padding-left: 1rem
          border-left: 1px solid #5666
          position: relative
          cursor: pointer
          img.svg
            width: 100%
            height: 100%
            object-position: left
            object-fit: contain
        .dropdown-cog
          width: 16px
          height: 16px
          margin-left: 10px

      .user
        color: #8293a4
        font-size: 14px
        svg
          fill: #9faebd
          margin-right: 0.5rem
          vertical-align: -3px
    .table
      &.table-hover
        cursor: pointer
        td .actions
          display: flex
          visibility: hidden
          .action-icon
            margin-right: 10px
        tbody tr:hover
          background-color: #f3f8ff
          .actions
            visibility: visible
      thead
        th
          background-color: #fafbfc
          font-size: 14px
          color: #9faebd
          font-weight: normal
          border-bottom-width: 1px
          padding: 0.5rem 0.75rem
    form
      label:not(.form-check-label)
        font-weight: 600
    .admin-title
      display: flex
      align-items: center
      line-height: normal
      min-height: 2.5rem
      margin-bottom: 1rem
      &.with-border
        padding-bottom: 1rem
        border-bottom: 1px solid #dfe2e6
        margin-bottom: 1.5rem
      .muted
        color: #666
      .chevron
        margin: 0 1rem
        &::before
          content: ""
          display: inline-block
          width: 10px
          height: 10px
          border-width: 0 2px 2px 0
          border-style: solid
          border-color: #3b80ee
          transform: rotate(-45deg) translateY(-4px)

    .sidebar-layout
      display: flex
      flex-direction: row
      flex: 1
      .sidebar-container
        flex: auto 0 0
        min-width: 220px
      .main-content-container
        flex: 1
        padding: 1.875rem 2.5rem
        display: flex
        flex-direction: column
`)
