import React from 'react'

import Twitter from 'components/icons/Twitter'
import Facebook from 'components/icons/Facebook'
import Instagram from 'components/icons/Instagram'
import Medium from 'components/icons/Medium'
import YouTube from 'components/icons/YouTube'
import Globe from 'components/icons/Globe'

const CmpMap = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  medium: Medium,
  youtube: YouTube
}

const SocialLink = ({ href, className, svg = {} }) => {
  if (!href) return null

  //searches the 'href' prop for keywords like twitter, facebook, instagram, etc, and sets the variable 'key' if a match is found.
  const key = Object.keys(CmpMap).find((s) => href.match(new RegExp(s, 'i')))
  const Cmp = CmpMap[key]

  //Default: If 'href' doesn't contain any of the expected keywords, it may be that the component is being called with a new/mistyped website address. Return a link with a 'Globe' icon.
  if (!Cmp) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        <Globe {...svg} />
      </a>
    )
  }

  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <Cmp {...svg} />
    </a>
  )
}

export default SocialLink
