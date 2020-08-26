import React from 'react'
import fbt from 'fbt'

import Tooltip from 'components/Tooltip'

import Delete from './_Delete'
import EditModal from './_Edit'

import networks from './_networks'

const SocialLinks = ({ socialLinks, setSocialLinks }) => {
  return (
    <>
      <div className="social-links">
        <div className="title">
          <fbt desc="admin.settings.general.social.socialMediaLinks">
            Social Media Links
          </fbt>
        </div>
        <div className="links">
          {networks.map((network) => {
            if (!socialLinks[network.value]) return null

            return (
              <SocialLink
                icon={network.icon}
                name={network.name}
                key={network.value}
                networkId={network.value}
                linkUrl={socialLinks[network.value]}
                removeLink={() =>
                  setSocialLinks({
                    [network.value]: ''
                  })
                }
                onChange={(newVal) => setSocialLinks(newVal)}
              />
            )
          })}
        </div>
        <div className="mt-3">
          <EditModal onChange={(newVal) => setSocialLinks(newVal)} />
        </div>
      </div>
    </>
  )
}

const SocialLink = ({
  icon,
  name,
  networkId,
  removeLink,
  linkUrl,
  onChange
}) => (
  <div>
    <Tooltip text={linkUrl} placement="left">
      <div className="d-flex">
        <div className="icon">{icon}</div>
        {name}
      </div>
    </Tooltip>
    <EditModal
      editMode={true}
      defaultValues={{
        network: networkId,
        link: linkUrl
      }}
      onChange={onChange}
    />
    <Delete className="ml-2" onConfirm={removeLink} />
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
          cursor: pointer
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
        padding: 0.5rem 0
        &:first-child
          margin-top: 0.5rem
        &:not(:first-child)
          border-top: 1px solid #cdd7e0

`)
