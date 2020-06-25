import React from 'react'
import get from 'lodash/get'

import Nav from './_Nav'

const StoreSelector = ({
  setActiveShop,
  admin,
  dispatch,
  newShop,
  setNewShop
}) => {
  const shops = get(admin, 'shops', [])
  return (
    <div className="admin">
      <Nav newShop={newShop} setNewShop={setNewShop} />
      <div className="shop-chooser">
        {!shops.length ? (
          <h3>Welcome to Dshop!</h3>
        ) : (
          <>
            <h3>Select a store</h3>
            <div className="shops">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => {
                    setActiveShop(shop.authToken)
                    setTimeout(() => {
                      dispatch({ type: 'reset', dataDir: shop.authToken })
                    }, 50)
                  }}
                >
                  {shop.name}
                </div>
              ))}
            </div>
          </>
        )}
        <div className="create-shop">
          <button
            className="btn btn-outline-primary btn-sm px-5"
            onClick={() => setNewShop(true)}
          >
            Add Store
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreSelector

require('react-styl')(`
  .admin .shop-chooser
    padding-top: 3rem
    background-color: #fafbfc
    display: flex
    flex-direction: column
    align-items: center
    flex: 1
    .create-shop
      margin-top: 2rem
    .shops
      margin-top: 1.5rem
      display: grid
      grid-template-columns: 50% 50%
      grid-column-gap: 1rem
      grid-row-gap: 1rem
      > div
        color: #3b80ee
        text-align: center
        font-size: 20px
        background: #fff
        border-radius: 10px
        box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.1)
        padding: 1.5rem 2rem
        cursor: pointer
        font-weight: bold
`)
