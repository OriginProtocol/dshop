import React from 'react'
import fbt, { FbtParam } from 'fbt'

import Link from 'components/Link'
import SocialLinks from 'components/SocialLinks'

import useConfig from 'utils/useConfig'

const Footer = () => {
  const date = new Date()
  const { config } = useConfig()
  return (
    <div className="container mt-20 sm:mt-48 mb-20 flex flex-col">
      <Link to="/" className="flex items-center justify-center">
        <img src={`${config.dataSrc}${config.logo}`} style={{ height: 60 }} />
      </Link>
      <SocialLinks
        className="flex mx-auto my-8"
        itemClassName="hover:opacity-75 mx-4"
        svg={{ color: '#fff', height: 18 }}
      />
      <div className="flex flex-col sm:flex-row items-center justify-center">
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
        <div className="mt-4 sm:mt-0 sm:ml-8">
          <fbt desc="footer.copyrightText">
            &copy; <FbtParam name="year">{date.getFullYear()}</FbtParam> Origin
            Protocol
          </fbt>
        </div>
      </div>
    </div>
  )
}

export default Footer
