import React from 'react'
import fbt from 'fbt'
import Link from 'components/Link'

const NoItems = ({ children, heading, description, linkTo, buttonText }) => (
  <div className="no-items">
    <div className="cta-wrap">
      <div className="cta">
        <h3>{heading}</h3>
        <div className="desc">
          {description}
          {children || buttonText ? (
            <>
              <br />
              <fbt desc="component.NoItems.getStarted">
                Click the button below to get started.
              </fbt>
            </>
          ) : null}
        </div>
        {children ? (
          children
        ) : buttonText ? (
          <Link to={linkTo}>
            <button className="btn btn-primary px-5" type="button">
              {buttonText}
            </button>
          </Link>
        ) : null}
      </div>
    </div>
  </div>
)

export default NoItems

require('react-styl')(`
  .no-items
    flex: 1
    margin-right: -2.5rem
    margin-bottom: -1.875rem
    background-image: url('images/cart-graphic.svg')
    background-position: bottom right
    background-size: contain
    background-repeat: no-repeat
    align-items: center
    justify-content: stretch
    .cta-wrap
      display: flex
      flex: 1
      height: 100%
      max-height: 350px
      align-items: center
    .cta
      min-height: 165px
      .desc
        font-size: 1rem
        color: #8293a4

      h3
        font-family: Lato
        font-size: 1.5rem
        font-weight: bold
        color: #000000

      .btn
        margin: 2.5rem 0 0 0

`)
