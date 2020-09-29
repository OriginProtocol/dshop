import React from 'react'

import fbt, { FbtParam } from 'fbt'

import useConfig from 'utils/useConfig'

import SocialLink from 'components/SocialLink'

const Footer = () => {
  const { config } = useConfig()
  const date = new Date()
  return (
    <div className="bg-black pt-8 pb-24 text-white text-sm mt-16">
      <div className="container flex items-center flex-col sm:flex-row gap-8 sm:gap-0">
        <div className="flex-1 flex gap-8 order-2 sm:order-1">
          <SocialLink
            color="#fff"
            href={config.twitter}
            iconStyle={{ height: '18' }}
          />
          <SocialLink
            color="#fff"
            href={config.facebook}
            iconStyle={{ height: '18' }}
          />
          <SocialLink
            color="#fff"
            href={config.instagram}
            iconStyle={{ height: '18' }}
          />
        </div>
        <div className="order-1 sm:order-2">
          <img src="ybm/YBM Black trans.PNG" style={{ width: 100 }} />
        </div>
        <div className="flex-1 flex justify-end order-3">
          <fbt desc="footer.copyrightText">
            &copy; Origin Protocol{' '}
            <FbtParam name="year">{date.getFullYear()}</FbtParam>
          </fbt>
        </div>
      </div>
      <div className="text-gray-600 flex flex-col items-center mt-8">
        <a
          className="order-2 sm:order-1 mt-8 sm:mt-0"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.originprotocol.com/en/dshop"
        >
          <fbt desc="footer.poweredBy">Powered by Origin Dshop</fbt>
        </a>
        <div className="flex gap-2 sm:gap-6 mt-4 order-1 sm:order-2 flex-col sm:flex-row text-center sm:text-left">
          <div>FAQ</div>
          <div>About Dshop</div>
          <div>Visit Origin</div>
          <div>Support</div>
        </div>
      </div>
    </div>
  )
}

export default Footer
