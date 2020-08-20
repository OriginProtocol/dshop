import React, { useState } from 'react'
import fbt from 'fbt'
import { useStateValue } from 'data/state'
import useAuth from 'utils/useAuth'

import Caret from 'components/icons/Caret'
import Popover from 'components/Popover'
import * as Icons from 'components/icons/Admin'

const UserDropdown = ({ className = '' }) => {
  const [shouldClose, setShouldClose] = useState(0)
  const [{ admin }] = useStateValue()
  const { logout } = useAuth()

  return (
    <Popover
      el="div"
      placement="bottom-start"
      className={`user ${className}`}
      contentClassName="user-dropdown"
      shouldClose={shouldClose}
      button={
        <>
          <Icons.User />
          {admin.name || admin.email}
          <Caret />
        </>
      }
    >
      <a
        href="#logout"
        className="dropdown-item"
        onClick={(e) => {
          e.preventDefault()
          logout()
          setShouldClose(true)
        }}
      >
        <Icons.Logout />
        <span className="ml-2">
          <fbt desc="Logout">Logout</fbt>
        </span>
      </a>
    </Popover>
  )
}

export default UserDropdown

require('react-styl')(`
  nav.admin-nav
    .user-dropdown
      position: absolute
      color: #000
      z-index: 1
      border-radius: 10px
      box-shadow: 0 2px 11px 0 rgba(0, 0, 0, 0.2)
      border: solid 1px #cdd7e0
      background-color: #ffffff
      padding: 0.75rem 0

    .user
      color: #8293a4
      cursor: pointer
      font-size: 14px
      display: flex
      align-items: center
      svg
        fill: #9faebd
        margin-right: 0.5rem
      .icon-caret
        fill: #9faebd
        margin-left: 0.5rem
        margin-top: 2px
`)
