import React from 'react'

import fbt from 'fbt'

const statusEnumToText = (status) => {
  switch (status) {
    case 'Pending':
      return <fbt desc="admin.settings.general.pending">Pending</fbt>

    case 'Success':
      return <fbt desc="admin.settings.general.live">Live</fbt>

    case 'Failure':
      return <fbt desc="admin.settings.general.failure">Error</fbt>

    case 'ToPublish':
      return (
        <fbt desc="admin.settings.general.awaitingPublish">
          Awaiting publish
        </fbt>
      )
  }

  return null
}

const DomainStatus = ({ status, onInfoClick }) => {
  return (
    <div className={`domain-status ${status.toLowerCase()}`}>
      {statusEnumToText(status)}
      {!onInfoClick ? null : (
        <img
          src="images/info-icon.svg"
          width="16"
          className="ml-2"
          onClick={onInfoClick}
        />
      )}
    </div>
  )
}

require('react-styl')(`
  .domain-status
    display: flex
    align-items: center
    &:before
      content: ' '
      width: 10px
      height: 10px
      display: inline-block
      margin-right: 7px
      border-radius: 50%
      background-color: #ffda26
    &.success:before
      background-color: #3beec3
    &.failure:before
      background-color: #dd0000

    img 
      cursor: pointer
`)

export default DomainStatus
