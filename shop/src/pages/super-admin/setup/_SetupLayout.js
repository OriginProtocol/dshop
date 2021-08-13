import React from 'react'

import { DshopLogoWhite } from 'components/icons/Admin'

const SetupLayout = ({ children }) => {
  return (
    <div className="setup-layout">
      <div className="container">
        <div className="logo">
          <DshopLogoWhite />
        </div>
        {children}
      </div>
    </div>
  )
}

export default SetupLayout

require('react-styl')(`
  .setup-layout
    min-height: 100vh
    width: 100%
    background-image: url('images/background-graphic.svg')
    background-size: cover
    padding-top: 4rem
    overflow: scroll

    .actions
      font-size: 18px
      text-align: center
      color: rgba(255, 255, 255, 0.8)
      padding-top: 1rem
      padding-bottom: 1rem
      a
        color: #fff

    .logo
      margin: 0 auto
      text-align: center
      svg
        height: 50px

    .form-group
      margin-bottom: 1.5rem

      label
        text-align: left
        color: #fff
        font-size: 1.125rem
        font-weight: bold
        margin-bottom: 0.5rem

      input, select, textarea
        border-radius: 5px
        border-style: solid
        border-width: 1px
        border-image-source: linear-gradient(to bottom, #1384ff, #006ee6)
        border-image-slice: 1
        background-image: linear-gradient(90deg, #00000085, #00000085), linear-gradient(to bottom, #1384ff, #006ee6)
        color: #fff

        &:focus
          color: #fff

        &:disabled
          color: #a3a3a3

        &::placeholder
          color: #a3a3a3
        &.is-invalid
          background-color: transparent

      .invalid-feedback
        color: #fff
        background-image: url(images/error-icon.svg)
        background-repeat: no-repeat
        padding-left: 25px
        line-height: 20px
        margin-top: 6px

      .input-group-prepend, .input-group-append
        .input-group-text
          background-image: linear-gradient(289deg, #02203f, #053c77 6%)
          color: #fff
          border: 0

    button
      box-shadow: 5px 5px 8px 0 #0065d2, -3px -3px 6px 0 #2a92ff, inset 3px 3px 2px 0 #0e4d90, inset -3px -3px 2px 0 #021d3a
      background-image: linear-gradient(289deg, #02203f, #053c77 6%)
      color: #fff

    button[type=submit]
      border-radius: 5px
      width: auto
      margin: 0.75rem auto
      display: inline-block
      padding: 0.5rem 1.75rem
      font-size: 1.125rem
`)
