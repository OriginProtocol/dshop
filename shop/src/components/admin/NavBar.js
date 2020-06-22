import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import AccountSelector from 'pages/admin/_AccountSelector'
import { DshopLogoWhite } from 'components/icons/Admin'

import { useStateValue } from 'data/state'
import useAuth from 'utils/useAuth'

const AdminBar = () => {
  const [{ adminLocation }, dispatch] = useStateValue()
  const location = useLocation()
  const history = useHistory()
  const { loading, logout } = useAuth({ only: localStorage.isAdmin })
  if (!localStorage.isAdmin) {
    return null
  }

  return (
    <nav className="admin-bar">
      <div className="container">
        <DshopLogoWhite width="90" fill="#fff" />
        <div className="ml-4 d-flex align-items-center share">
          {loading ? null : <AccountSelector pathname="/" forceTitle={true} />}
        </div>
        <div className="d-flex">
          <a
            href="#/admin"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault()
              dispatch({ type: 'setStorefrontLocation', location })
              history.push(adminLocation || '/admin')
            }}
          >
            Admin
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              logout()
            }}
            className="nav-link"
          >
            Logout
          </a>
        </div>
      </div>
    </nav>
  )
}

export default AdminBar

require('react-styl')(`
  .admin-bar
    > .container
      display: flex
      justify-content: space-between
      align-items: center
      > div:nth-child(1)
        flex: 1
      > div:nth-child(2)
        flex: 1
      > div:nth-child(2)
        flex: 4
    background: #000
    border-bottom: 5px solid #0071ff
    font-size: 0.875rem
    color: #fff
    .dshop-logo
      background-image: url(images/dshop-logo.svg)
      width: 55px
      height: 22px
      background-repeat: no-repeat
      background-size: contain
    a
      color: #eee
      &:hover,&:active,&:focus
        color: #fff
    .earnings
      display: flex
      margin-right: 1rem
      padding-right: 2rem
      border-right: 1px solid #555555
      > span
        display: flex
        align-items: center
        &:not(:last-child)
          margin-right: 2.5rem
        svg
          margin: 0 0.5rem 0 0.75rem
          width: 1.25rem
    .share
      .btn
        min-width: 4rem
        min-height: 1.75rem
        display: flex
        justify-content: center
        svg
          flex: 1
          max-height: 18px
          fill: #fff
        &:hover svg
          fill: #000

`)
