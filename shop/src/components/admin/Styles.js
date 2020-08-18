/*
  Styles
*/

require('react-styl')(`
  .fullwidth-container
    width: 100%
    flex: 1
    padding: 0 1.125rem
    .row
      margin: 0

  .admin
    -webkit-font-smoothing: antialiased
    min-height: 100vh
    display: flex
    flex-direction: column

    h1,h2,h3
      color: #000
    h1
      font-size: 24px

    .flex-1
      flex: 1

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
        > span
          font-size: 14px
          font-weight: normal
          color: #8293a4
          margin-left: 0.25rem

    .footer-actions
      display: flex
      margin-top: 2rem
      padding-top: 2rem
      border-top: 1px solid #dee2ee
    .admin-title .actions,.footer-actions .actions
      margin-left: auto
      display: grid
      grid-auto-columns: 1fr
      grid-auto-flow: column
      column-gap: 0.75rem
      .btn
        padding-left: 2rem
        padding-right: 2rem
    .admin-title
      display: flex
      align-items: center
      line-height: normal
      min-height: 2.5rem
      margin-bottom: 1rem
      line-height: 2.5rem
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
