import React from 'react'
import fbt from 'fbt'
import useConfig from 'utils/useConfig'
import pick from 'lodash/pick'

import TwitterIcon from 'components/icons/Twitter'
import MediumIcon from 'components/icons/Medium'
import InstagramIcon from 'components/icons/Instagram'
import FacebookIcon from 'components/icons/Facebook'
import YouTubeIcon from 'components/icons/YouTube'
import GlobeIcon from 'components/icons/Globe'

const SocialLinks = ({
  el = 'div',
  className = 'social',
  itemClassName,
  svg = {},
  contentOnly
}) => {
  const { config } = useConfig()
  const social = pick(
    config,
    'facebook',
    'twitter',
    'medium',
    'instagram',
    'youtube',
    'otherMedia'
  )
  if (!Object.keys(social).length) {
    return null
  }

  const El = el
  const linkProps = {
    className: itemClassName,
    target: '_blank',
    rel: 'noreferrer'
  }

  const content = (
    <>
      {!config.twitter ? null : (
        <a
          {...linkProps}
          href={config.twitter}
          title={fbt('Twitter', 'Twitter')}
        >
          <TwitterIcon {...svg} />
        </a>
      )}
      {!config.facebook ? null : (
        <a
          {...linkProps}
          href={config.facebook}
          title={fbt('Facebook', 'Facebook')}
        >
          <FacebookIcon {...svg} />
        </a>
      )}
      {!config.youtube ? null : (
        <a
          {...linkProps}
          href={config.youtube}
          title={fbt('YouTube', 'YouTube')}
        >
          <YouTubeIcon {...svg} />
        </a>
      )}
      {!config.medium ? null : (
        <a {...linkProps} href={config.medium} title={fbt('Medium', 'Medium')}>
          <MediumIcon {...svg} />
        </a>
      )}
      {!config.instagram ? null : (
        <a
          {...linkProps}
          href={config.instagram}
          title={fbt('Instagram', 'Instagram')}
        >
          <InstagramIcon {...svg} />
        </a>
      )}
      {!config.otherMedia ? null : (
        <a
          {...linkProps}
          href={config.otherMedia}
          title={fbt('Website', 'Website')}
        >
          <GlobeIcon {...svg} />
        </a>
      )}
    </>
  )

  if (contentOnly) return content

  return <El className={className}>{content}</El>
}

export default SocialLinks
