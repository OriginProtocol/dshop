import React from 'react'
import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'
import Link from 'components/Link'
import SocialLink from 'components/SocialLink'

const Footer = () => {
  const { config } = useConfig()
  const date = new Date()
  return (
    <div className="container mb-24">
      <div className="mb-24 flex flex-col items-center">
        <img style={{ width: 80 }} src={`${config.dataSrc}${config.logo}`} />
      </div>

      <div className="font-sm flex justify-between flex-col sm:flex-row items-center gap-6 sm:gap-0">
        <div className="flex sm:gap-8 flex-1 flex-col sm:flex-row">
          <div>
            <a
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
        <div className="flex gap-4">
          <SocialLink
            href={config.twitter}
            svg={{ height: '16', color: '#fff' }}
          />
          <SocialLink
            href={config.instagram}
            svg={{ height: '16', color: '#fff' }}
          />
        </div>
        <div className="flex-1 flex justify-end gap-4 sm:flex-row">
          <Link to="/about">About</Link>
        </div>
      </div>
    </div>
  )
}

export default Footer
