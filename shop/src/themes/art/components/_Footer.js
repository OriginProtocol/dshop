import React from 'react'
import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'
import Link from 'components/Link'

import SocialLinks from 'components/SocialLinks'

/*
 * @param policyHeadings <Array<string>> Individual elements of this array are displayed on the footer of a store's website. When a user clicks on a 'heading', they're routed to the corresponding policy page.
 */
const Footer = ({ policyHeadings }) => {
  const { config } = useConfig()

  const date = new Date()

  return (
    <>
      <div className="border-t mt-24" />

      <div className="container pt-16 pb-16 sm:pb-48">
        <div className="flex flex-col sm:flex-row justify-between">
          <Link
            to="/"
            className="text-2xl font-medium leading-none font-header text-primary"
          >
            {config.title}
          </Link>
          <SocialLinks
            className="flex flex-row mt-4 ml-auto sm:mt-0"
            svg={{
              height: 18,
              className:
                'inline-block ml-8 text-secondary hover:text-primary fill-current'
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between mt-8 text-secondary text-sm">
          <div className="flex flex-col sm:flex-row pb-8 sm:pb-0">
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="mr-10"
              href="https://www.originprotocol.com/en/dshop"
            >
              <fbt desc="footer.poweredBy">Powered by Origin Dshop</fbt>
            </a>
            <div>
              <fbt desc="footer.copyrightText">
                &copy; Origin Protocol{' '}
                <FbtParam name="year">{date.getFullYear()}</FbtParam>
              </fbt>
            </div>
          </div>
          <ul className="flex flex-col sm:flex-row ">
            <li className="pb-4 sm:mr-10">
              <Link to="/about">About</Link>
            </li>
            <div className="policies">
              {policyHeadings
                ? policyHeadings.map((element, index) => {
                    return (
                      <li key={`${index}`} className="pb-4 sm:mr-10">
                        <Link to={`/policy${index + 1}`}>{element}</Link>
                      </li>
                    )
                  })
                : null}
            </div>
            <li className="pb-4">
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default Footer
