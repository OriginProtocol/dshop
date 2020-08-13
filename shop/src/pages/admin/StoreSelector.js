import React from 'react'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useShops from 'utils/useShops'
import Link from 'components/Link'
import ShopSearch from 'components/admin/ShopSearch'
import Paginate from 'components/Paginate'
import Nav from './_Nav'

const StoreSelector = ({ setActiveShop, newShop, setNewShop }) => {
  const [{ admin }, dispatch] = useStateValue()
  const { shops, shopsPagination } = useShops()
  const superuser = get(admin, 'superuser', false)

  return (
    <div className="admin">
      <Nav newShop={newShop} setNewShop={setNewShop} />

      {!admin.shopsCount ? (
        <div className="shop-chooser-empty">
          <div>
            <h1>Welcome to Dshop</h1>
            <p>
              Dshop allows you to have more than one shop per account. Start by
              creating your first one.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setNewShop(true)}
              children="Create a shop"
            />
          </div>
        </div>
      ) : (
        <div className="shop-chooser">
          <h3>Select a store</h3>
          <ShopSearch />
          {shops.length > 0 ? null : (
            <div className="mt-4 text-center muted">No results</div>
          )}
          <div className={`shops${shops.length > 1 ? ' multi' : ''}`}>
            {shops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => setActiveShop(shop.authToken)}
                children={shop.name}
              />
            ))}
          </div>
          <div className="create-shop">
            <button
              className="btn btn-outline-primary btn-sm px-5"
              onClick={() => setNewShop(true)}
              children="Add Store"
            />
            {!superuser ? null : (
              <Link to="/super-admin" className="btn btn-link">
                Super admin
              </Link>
            )}
          </div>
          <Paginate
            total={shopsPagination.totalCount}
            perPage={shopsPagination.perPage}
            page={shopsPagination.page}
            onChange={(page) => dispatch({ type: 'shopsPaginate', page })}
          />
        </div>
      )}
    </div>
  )
}

export default StoreSelector

require('react-styl')(`
  .admin .shop-chooser-empty
    background-image: url(images/empty-stores.svg)
    background-position: center right
    background-repeat: no-repeat
    background-size: 50% 80vh
    flex: 1
    display: flex
    align-items: center
    justify-content: center
    > div
      max-width: 400px
      margin-right: 33%
      font-size: 18px
      line-height: normal
      p
        color: #8293a4
      h1
        font-weight: bold
        margin-bottom: 1rem
      .btn
        font-weight: bold
        margin-top: 1.5rem
        padding-left: 2rem
        padding-right: 2rem
  .admin .shop-chooser
    padding-top: 3rem
    background-color: #fafbfc
    display: flex
    flex-direction: column
    align-items: center
    flex: 1
    .create-shop
      margin-top: 2rem
      display: flex
      flex-direction: column
      align-items: center
    .shops
      margin-top: 1.5rem
      &.multi
        display: grid
        grid-template-columns: 1fr 1fr
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
        max-width: 250px
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis
`)
