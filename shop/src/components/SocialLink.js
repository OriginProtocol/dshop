import React from 'react'

import Twitter from 'components/icons/Twitter'
import Facebook from 'components/icons/Facebook'
import Instagram from 'components/icons/Instagram'

const CmpMap = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram
}

const SocialLink = ({ href, className, svg = {} }) => {
  if (!href) return null

  const key = Object.keys(CmpMap).find((s) => href.match(new RegExp(s, 'i')))
  const Cmp = CmpMap[key]

  if (!Cmp) {
    return null
  }

  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <Cmp {...svg} />
    </a>
  )
}

export default SocialLink
