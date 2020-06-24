import React from 'react'

import Link from 'components/Link'

const NoItems = ({ children, heading, description, linkTo, buttonText }) => (
  <div className="no-items">
    <div className="cta">
      <h3>{heading}</h3>
      <div className="desc">
        {description}
        {children || buttonText ? (
          <>
            <br />
            Click the button below to get started.
          </>
        ) : null}
      </div>
      {children ? (
        children
      ) : buttonText ? (
        <Link to={linkTo}>
          <button className="btn btn-primary px-5">{buttonText}</button>
        </Link>
      ) : null}
    </div>
  </div>
)

export default NoItems

require('react-styl')(`
  .no-items
    height: calc(100% - 1.5rem)
    max-height: 450px
    background-image: url('images/cart-graphic.svg')
    background-position: bottom right
    background-size: contain
    background-repeat: no-repeat
    display: flex
    align-items: center
    .cta
      .desc
        font-size: 1rem
        color: #8293a4

      h3
        font-family: Lato
        font-size: 1.5rem
        font-weight: bold
        color: #000000

      .btn
        margin: 2.5rem 0 3.5rem 0

`)
