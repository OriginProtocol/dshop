import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useRedirect from 'utils/useRedirect'

import Caret from 'components/icons/Caret'
import Popover from 'components/Popover'

// Sets width when SVG images don't have width set explicitly
const AutoWidthImg = ({ src }) => {
  const [width, setWidth] = useState({})
  return (
    <img
      src={src}
      width={width[src]}
      onLoad={(e) => {
        if (src.match(/.svg$/i)) {
          setWidth({ [src]: e.target.width })
        }
      }}
    />
  )
}

const AccountSelector = ({ onNewShop, forceTitle, superAdmin }) => {
  const [shouldClose, setShouldClose] = useState(0)
  const [search, setSearch] = useState('')
  const { config, setActiveShop } = useConfig()
  const [{ admin }] = useStateValue()
  const redirectTo = useRedirect()
  const location = useLocation()
  const allShops = get(admin, 'shops', [])

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  if (!allShops.length || (!config.activeShop && !superAdmin)) {
    return null
  }

  const logo = config.logo ? `${config.dataSrc}${config.logo}` : ''

  const shops = allShops.filter(
    (s) => s.name.toLowerCase().indexOf(search.toLowerCase()) >= 0
  )

  return (
    <Popover
      el="div"
      placement="bottom-start"
      className="shop-title"
      contentClassName="shops-dropdown"
      shouldClose={shouldClose}
      button={
        <>
          {superAdmin ? (
            'Super Admin'
          ) : logo && !forceTitle ? (
            <AutoWidthImg src={logo} />
          ) : (
            config.fullTitle
          )}
          <Caret />
        </>
      }
    >
      <>
        {allShops.length < 15 ? null : (
          <div className="shop-search">
            <input
              type="search"
              className="form-control form-control-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
            />
          </div>
        )}
        {shops.length > 0 ? null : (
          <div className="pb-3 text-center muted">No results</div>
        )}
        {shops.map((shop) => (
          <div
            className={`shop-el${
              shop.authToken === config.activeShop ? ' selected' : ''
            }`}
            key={shop.id}
            onClick={() => {
              setActiveShop(shop.authToken)
              setShouldClose(shouldClose + 1)
              if (superAdmin) {
                redirectTo('/admin')
              }
              if (!isAdmin) {
                redirectTo('/')
              }
            }}
          >
            <img src="images/green-checkmark.svg" />
            {shop.name}
          </div>
        ))}
        {!admin.superuser ? null : (
          <div
            className="shop-el bt"
            onClick={() => {
              setActiveShop()
              setShouldClose(shouldClose + 1)
              redirectTo('/super-admin/shops')
            }}
          >
            <img src="images/green-checkmark.svg" />
            Super Admin
          </div>
        )}
        {!onNewShop ? null : (
          <div
            className="new-shop-link"
            onClick={() => {
              setShouldClose(shouldClose + 1)
              onNewShop()
            }}
          >
            <div className="add-shop-icon">+</div>
            Add a shop
          </div>
        )}
      </>
    </Popover>
  )
}

export default AccountSelector

require('react-styl')(`
  .shop-title
    cursor: pointer
    .icon.icon-caret
      fill: #3b80ee
      margin-left: 0.75rem

  .shops-dropdown
    position: absolute
    color: #000
    z-index: 1
    min-width: 250px
    border-radius: 10px
    box-shadow: 0 2px 11px 0 rgba(0, 0, 0, 0.2)
    border: solid 1px #cdd7e0
    background-color: #ffffff
    overflow: auto
    max-height: calc(100vh - 5rem)

    padding: 1.5rem

    .shop-search
      padding-bottom: 1rem
      border-bottom: 1px solid #dfe2e6
      margin-bottom: 1rem

    .new-shop-link
      cursor: pointer
      display: flex
      align-items: center
      font-size: 14px
      color: #3b80ee
      &:not(:first-child)
        border-top: 1px solid #cdd7e0
        padding-top: 1rem
        margin-top: 1rem
      .add-shop-icon
        border: solid 1px #3b80ee
        border-radius: 50%
        height: 18px
        width: 18px
        display: flex
        align-items: center
        justify-content: center
        margin-right: 5px

    .shop-el
      display: flex
      align-items: center
      font-size: 1rem
      cursor: pointer
      &.bt
        border-top: solid 1px #cdd7e0
        padding-top: 0.75rem
      &:not(:last-child)
        margin-bottom: 1rem
      img
        height: 14px
        width: 14px
        object-fit: contain
        margin-right: 10px
      &:not(.selected) img
        visibility: hidden
`)
