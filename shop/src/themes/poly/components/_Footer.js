import React from 'react'
import fbt, { FbtParam } from 'fbt'
import get from 'lodash/get'
import useConfig from 'utils/useConfig'
import Link from 'components/Link'
import SocialLinks from 'components/SocialLinks'
import useThemeVars from 'utils/useThemeVars'

/*
 * @param policyHeadings <Array<string>> Individual elements of this array are displayed on the footer of a store's website, so that the user can click on them
 * and be routed to the store's policy pages
 */
const Footer = ({ policyHeadings }) => {
  const { config } = useConfig()
  const date = new Date()
  const themeVars = useThemeVars()
  const relativeLogoPath = get(themeVars, 'header.logo.0.url')
  const logoUrl = `${config.dataSrc}${relativeLogoPath}`

  return (
    <div className="container mb-24">
      <div className="mb-24 flex flex-col text-xl font-bold items-center">
        {relativeLogoPath ? (
          <img style={{ width: 80 }} src={logoUrl} />
        ) : (
          config.title
        )}
      </div>

      <div className="font-sm flex justify-between flex-col sm:flex-row items-center gap-6 sm:gap-0">
        <div className="flex sm:gap-8 flex-1 flex-col sm:flex-row">
          <div>
            <a
              className="hover:opacity-75"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.originprotocol.com/en/dshop"
            >
              <fbt desc="footer.poweredBy">Powered by Origin Dshop</fbt>
            </a>
          </div>
          <div>
            <fbt desc="footer.copyrightText">
              &copy; Origin Protocol{' '}
              <FbtParam name="year">{date.getFullYear()}</FbtParam>
            </fbt>
          </div>
        </div>
        <SocialLinks
          className="flex gap-4"
          itemClassName="hover:opacity-75"
          svg={{ height: '16', color: '#fff' }}
        />
        <div className="flex-1 flex justify-end gap-4 sm:flex-row">
          <Link to="/about" className="hover:opacity-75">
            About
          </Link>
          <ul>
            {/* Display links to policy pages if and only if the prop 'policyHeadings' is passed a value other than the expected default */}
            {policyHeadings &&
              policyHeadings != [''] &&
              policyHeadings.map((heading, index) => {
                return (
                  <li key={`${index}`}>
                    <Link to={`/policy${index + 1}`}>{heading}</Link>
                  </li>
                )
              })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Footer
