import React from 'react'
import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'
import Link from 'components/Link'

import SocialLink from 'components/SocialLink'

const Footer = () => {
  const { config } = useConfig()

  const Social = ({ href, height = 16, first }) => (
    <SocialLink
      className={first ? null : 'ml-8'}
      href={href}
      svg={{ className: 'inline-block', height, color: '#999' }}
    />
  )

  const date = new Date()

  return (
    <>
      <div className="border-t mt-24" />

      <div className="container pt-16 pb-16 sm:pb-48">
        <div className="flex flex-col sm:flex-row justify-between">
          <Link to="/" className="text-2xl font-medium leading-none">
            {config.title}
          </Link>
          <div className="flex flex-row mt-4 sm:mt-0">
            <Social href={config.twitter} height="18" first />
            <Social href={config.facebook} />
            <Social href={config.instagram} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between mt-8 text-gray-500 text-sm">
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
