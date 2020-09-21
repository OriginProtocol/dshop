import React from 'react'
import fbt from 'fbt'
import useConfig from 'utils/useConfig'

import TwitterIcon from 'components/icons/Twitter'
import MediumIcon from 'components/icons/Medium'
import InstagramIcon from 'components/icons/Instagram'
import FacebookIcon from 'components/icons/Facebook'
import YouTubeIcon from 'components/icons/YouTube'

const SocialLinks = ({ el = 'div', className = 'social' }) => {
  const { config } = useConfig()
  const social = config.twitter || config.medium || config.instagram
  if (!social) {
    return null
  }

  const El = el

  return (
    <El className={className}>
      {!config.twitter ? null : (
        <a href={config.twitter} title={fbt('Twitter', 'Twitter')}>
          <TwitterIcon />
        </a>
      )}
      {!config.facebook ? null : (
        <a href={config.facebook} title={fbt('Facebook', 'Facebook')}>
          <FacebookIcon />
        </a>
      )}
      {!config.youtube ? null : (
        <a href={config.youtube} title={fbt('YouTube', 'YouTube')}>
          <YouTubeIcon />
        </a>
      )}
      {!config.medium ? null : (
        <a href={config.medium} title={fbt('Medium', 'Medium')}>
          <MediumIcon />
        </a>
      )}
      {!config.instagram ? null : (
        <a href={config.instagram} title={fbt('Instagram', 'Instagram')}>
          <InstagramIcon />
        </a>
      )}
    </El>
  )
}

export default SocialLinks
