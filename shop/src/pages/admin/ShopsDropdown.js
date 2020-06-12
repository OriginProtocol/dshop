import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

const ShopsDropdown = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const { config } = useConfig()
  const [{ admin }] = useStateValue()
  const history = useHistory()

  return (
    <div className="shops-title-wrapper">
      <div className="shop-title" onClick={() => setShowDropdown(!showDropdown)}>
        {config.logo ? (
          <img src={`${config.dataSrc}${config.logo}`} />
        ) : (
          config.title
        )}
        <img className="dropdown-cog" src="images/right-arrow-large.svg" />
      </div>
      {showDropdown && (
        <div className="shops-dropdown">
          {admin.shops.map(shop => {
            return (
              <div 
                className={`shop-el${shop.authToken === config.activeShop ? ' selected' : ''}`} 
                key={shop.id}
                onClick={() => {
                  setShowDropdown(false)

                  if (localStorage.activeShop === shop.authToken) return
                  localStorage.activeShop = shop.authToken
                  history.push({
                    pathname: `/admin`,
                    state: { scrollToTop: true }
                  })
                }}>
                <img src="/images/green-checkmark.svg" />
                {shop.name}
              </div>
            )
          })}
          <div className="new-shop-link">
            <div className="add-shop-icon">+</div>
            Add a shop
          </div>
        </div>
      )}
    </div>
  )
}

export default ShopsDropdown

require('react-styl')(`
  .shops-title-wrapper
    position: relative

  .shops-dropdown
    position: absolute
    width: 250px
    left: 1rem
    top: 50px

    border-radius: 10px
    box-shadow: 0 2px 11px 0 rgba(0, 0, 0, 0.2)
    border: solid 1px #cdd7e0
    background-color: #ffffff

    padding: 1.5rem

    .new-shop-link
      border-top: 1px solid #cdd7e0
      padding-top: 1rem
      margin-top: 1rem
      display: flex
      align-items: center
      font-size: 0.75rem
      color: #3b80ee
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
