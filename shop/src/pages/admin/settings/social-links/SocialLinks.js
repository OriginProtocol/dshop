import React from 'react'

import Facebook from 'components/icons/Facebook'
import Twitter from 'components/icons/Twitter'
import Instagram from 'components/icons/Instagram'
import Medium from 'components/icons/Medium'
import YouTube from 'components/icons/YouTube'
import PlusIcon from 'components/icons/Plus'

import Delete from './_Delete'

const SocialLinks = ({ socialLinks, setSocialLinks }) => {
  return (
    <div className="social-links">
      <div className="title">Social Media Links</div>
      <div className="links">
        {!socialLinks.facebook ? null : (
          <SocialLink icon={<Facebook />} name="Facebook" />
        )}
        {!socialLinks.twitter ? null : (
          <SocialLink icon={<Twitter />} name="Twitter" />
        )}
        {!socialLinks.instagram ? null : (
          <SocialLink icon={<Instagram />} name="Instagram" />
        )}
        {!socialLinks.medium ? null : <SocialLink icon={<Medium />} name="Medium" />}
        {!socialLinks.youtube ? null : (
          <SocialLink icon={<YouTube />} name="YouTube" />
        )}
      </div>
      <div className="mt-3">
        <button type="button" className="btn btn-outline-primary d-flex align-items-center w-100">
          <PlusIcon className="mr-2" /> Add Link
        </button>
      </div>
    </div>
  )
}

const SocialLink = ({ icon, name }) => (
  <div>
    <div className="icon">{icon}</div>
    {name}
    <a href="#edit" className="ml-auto" onClick={(e) => e.preventDefault()}>
      <img src="images/edit-icon.svg" />
    </a>
    <Delete className="ml-2" />
  </div>
)

export default SocialLinks

require('react-styl')(`
  .social-links
    border-radius: 10px
    border: solid 1px #cdd7e0
    background-color: #ffffff
    padding: 1.125rem
    font-size: 14px
    line-height: normal
    .title
      font-weight: bold
    .links
      > div
        a
          visibility: hidden
        &:hover a
          visibility: visible
        .icon
          background-color: #3b80ee
          width: 22px
          height: 22px
          border-radius: 11px
          margin-right: 0.5rem
          display: flex
          align-items: center
          justify-content: center
          svg
            flex: 1
            max-width: 60%
            max-height: 60%
            fill: #fff
        display: flex
        align-items: center
        &:first-child
          margin-top: 0.5rem
        &:not(:last-child)
          border-bottom: 1px solid #cdd7e0
        padding: 0.5rem 0
`)
