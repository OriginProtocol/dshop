import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import fbt, { FbtParam } from 'fbt'
import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useShops from 'utils/useShops'
import useRedirect from 'utils/useRedirect'

import Caret from 'components/icons/Caret'
import Popover from 'components/Popover'
import ShopSearch from 'components/admin/ShopSearch'

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
  const { config, setActiveShop } = useConfig()
  const [{ admin }, dispatch] = useStateValue()
  const redirectTo = useRedirect()
  const location = useLocation()
  const { shops, shopsPagination } = useShops()

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  if (!config.activeShop && !superAdmin) {
    return null
  }

  const logo = config.logo ? `${config.dataSrc}${config.logo}` : ''

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
        <ShopSearch />
        {shops.length > 0 ? null : (
          <div className="pb-3 text-center muted">
            <fbt desc="admin.AccountSelector.zeroSearchResults">No results</fbt>
          </div>
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

        <div className="actions">
          {shopsPagination.totalCount <= shopsPagination.perPage ? null : (
            <div style={{ margin: '-0.5rem 0 1rem 0' }}>
              <a
                href="#prev"
                className={shopsPagination.page === 1 ? 'text-muted' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  if (shopsPagination.page === 1) return
                  dispatch({
                    type: 'shopsPaginate',
                    page: shopsPagination.page - 1
                  })
                }}
              >
                <fbt desc="Prev">Prev</fbt>
              </a>
              <div>
                <fbt desc="admin.AccountSelector.searchPagination">
                  Page <FbtParam name="page">{shopsPagination.page}</FbtParam>{' '}
                  of{' '}
                  <FbtParam name="numPages">
                    {shopsPagination.numPages}
                  </FbtParam>
                </fbt>
              </div>
              <a
                href="#prev"
                className={
                  shopsPagination.page === shopsPagination.numPages
                    ? 'text-muted'
                    : ''
                }
                onClick={(e) => {
                  e.preventDefault()
                  if (shopsPagination.page === shopsPagination.numPages) return
                  dispatch({
                    type: 'shopsPaginate',
                    page: shopsPagination.page + 1
                  })
                }}
              >
                <fbt desc="Next">Next</fbt>
              </a>
            </div>
          )}
          <div>
            {!onNewShop ? null : (
              <a
                className="new-shop-link"
                onClick={(e) => {
                  e.preventDefault()
                  setShouldClose(shouldClose + 1)
                  onNewShop()
                }}
              >
                <div className="add-shop-icon">+</div>
                <fbt desc="admin.AccountSelector.addShop">Add a Shop</fbt>
              </a>
            )}
            {!admin.superuser ? null : (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setActiveShop()
                  setShouldClose(shouldClose + 1)
                  redirectTo('/super-admin/shops')
                }}
              >
                Super Admin
              </a>
            )}
          </div>
        </div>
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

    .actions
      border-top: solid 1px #dfe2e6
      padding-top: 1.25rem
      margin-top: 0.25rem
      align-items: center
      font-size: 14px
      > div
        display: flex
        justify-content: space-between
      a
        color: #3b80ee

      .new-shop-link
        cursor: pointer
        display: flex
        align-items: center
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
