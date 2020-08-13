import React from 'react'
import fbt, { FbtParam } from 'fbt'
import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import CurrencySelect from 'components/CurrencySelect'
import LocaleSelect from 'components/LocaleSelect'

const Footer = () => {
  const { config } = useConfig()
  const date = new Date()
  return (
    <div className="footer">
      <div className="container">
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="powered-by"
          href="https://www.originprotocol.com/en/dshop"
        >
          <fbt desc="footer.poweredBy">
            Powered by <span>Origin Dshop</span>
          </fbt>
        </a>
        <div className="copyright">
          <fbt desc="footer.copyrightText">
            &copy; Origin Protocol{' '}
            <FbtParam name="year">{date.getFullYear()}</FbtParam>.
          </fbt>
        </div>
        <div>
          <div className="links">
            <LocaleSelect />
            <CurrencySelect />
            {config.terms ? (
              <Link to="/terms">
                <fbt desc="TermsAndConditions">Terms &amp; Conditions</fbt>
              </Link>
            ) : null}
            <Link to="/about">
              <fbt desc="FAQ">FAQ</fbt>
            </Link>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://medium.com/originprotocol/built-on-origin-a-decentralized-shopify-alternative-888adc4198b0"
            >
              <fbt desc="footer.aboutLink">About Dshop</fbt>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer

require('react-styl')(`
  .footer
    color: #999999
    font-weight: normal
    font-size: 0.875rem
    padding: 4rem 0
    margin-top: 4rem
    background-color: #f8f8f8
    box-shadow: 0 -1px 0 0 rgba(227, 227, 227, 0.5)
    -webkit-font-smoothing: antialiased
    a
      color: #999999
    > .container
      display: flex
      justify-content: space-between
    .powered-by
      background: url(images/dshop-logo.svg) no-repeat right 4px
      padding-right: 75px
      padding-bottom: 4px
      span
        display: none
    .links
      display: flex
      white-space: nowrap
      align-items: baseline
      :not(:last-child)
        margin-right: 2rem

  @media (max-width: 767.98px)
    .footer
      padding: 1.5rem 0
      .links
        margin-top: 1rem
        flex-direction: column
        align-items: center
        :not(:last-child)
          margin-right: 0
      .container
        :not(:last-child)
          margin-bottom: 0.5rem
        .copyright
          display: none
        text-align: center
        flex-direction: column
        align-items: center
`)
