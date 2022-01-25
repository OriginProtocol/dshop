import React from 'react'
import get from 'lodash/get'

import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'
import useThemeVars from 'utils/useThemeVars'

import CurrencySelect from 'components/CurrencySelect'
import SocialLink from 'components/SocialLink'
import Link from 'components/Link'

/*
 * @param policyHeadings <Array<string>> Individual elements of this array are displayed on the footer of a store's website. When a user clicks on a 'heading', they're routed to the corresponding policy page.
 */
const Footer = ({ policyHeadings }) => {
  const { config } = useConfig()
  const themeVars = useThemeVars()

  const relativeLogoPath = get(themeVars, 'header.logo.0.url')
  const logoUrl = `${config.dataSrc}${relativeLogoPath}`

  const date = new Date()
  return (
    <div className="bg-black pt-8 pb-24 text-white text-sm sm:mt-16">
      <div className="container flex items-center flex-col sm:flex-row">
        <div className="flex-1 order-2 sm:order-1 flex">
          <div className="grid grid-flow-col gap-6">
            <SocialLink
              href={config.twitter}
              className="hover:opacity-75"
              svg={{ height: '18', color: '#fff' }}
            />
            <SocialLink
              href={config.facebook}
              className="hover:opacity-75"
              svg={{ height: '18', color: '#fff' }}
            />
            <SocialLink
              href={config.instagram}
              className="hover:opacity-75"
              svg={{ height: '18', color: '#fff' }}
            />
          </div>
        </div>
        <div className="order-1 sm:order-2 font-bold text-xl">
          {relativeLogoPath ? (
            <img style={{ width: 100 }} src={logoUrl} />
          ) : (
            config.title
          )}
        </div>
        <div className="flex-1 flex justify-end order-3 mt-8 sm:mt-0">
          <fbt desc="footer.copyrightText">
            &copy; Origin Protocol{' '}
            <FbtParam name="year">{date.getFullYear()}</FbtParam>
          </fbt>
        </div>
      </div>
      <div className="text-gray-600 flex flex-col items-center mt-8">
        <a
          className="order-2 sm:order-1 mt-8 sm:mt-0 hover:opacity-75"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.originprotocol.com/en/dshop"
        >
          <fbt desc="footer.poweredBy">Powered by Origin Dshop</fbt>
        </a>
        <div className="grid gap-2 sm:gap-6 mt-4 order-1 sm:order-2 grid-flow-row sm:grid-flow-col text-center sm:text-left">
          <Link className="hover:opacity-75" to="/about">
            About
          </Link>
          <div className="policies">
            <ul className="grid gap-2 sm:gap-6 grid-flow-row sm:grid-flow-col text-center sm:text-left">
              {policyHeadings
                ? policyHeadings.map((element, index) => {
                    return (
                      <li key={`${index}`}>
                        <Link
                          className="hover:opacity-75"
                          to={`/policy${index + 1}`}
                        >
                          {element}
                        </Link>
                      </li>
                    )
                  })
                : null}
            </ul>
          </div>
          <Link className="hover:opacity-75" to="/contact">
            Contact
          </Link>
          <CurrencySelect className="bg-black" />
        </div>
      </div>
    </div>
  )
}

export default Footer
