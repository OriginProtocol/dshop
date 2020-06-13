import React from 'react'

import { DshopLogo } from 'components/icons/Admin'

const SetupLayout = ({ children }) => {
  return (
    <div className="setup-layout">
      <div className="container">
        <div className="logo">
          <DshopLogo />
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
    background-image: url('/images/background-graphic.svg')
    background-size: cover
    padding-top: 4rem
    overflow: scroll

    .logo 
      margin: 0 auto
      text-align: center
      svg
        height: 50px
`)
