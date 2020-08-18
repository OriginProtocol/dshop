import React, { useState } from 'react'
import get from 'lodash/get'
import fbt from 'fbt'
import useShops from 'utils/useShops'
import useAutoFocus from 'utils/useAutoFocus'
import { useStateValue } from 'data/state'

const ShopSearch = () => {
  const [{ admin }, dispatch] = useStateValue()
  const { shopsPagination } = useShops()
  const searchRef = useAutoFocus()
  const [search, setSearch] = useState(shopsPagination.search || '')
  if (get(admin, 'shopsCount', 0) < 10) {
    return null
  }
  return (
    <form
      className="shop-search"
      onSubmit={(e) => {
        e.preventDefault()
        dispatch({ type: 'shopsPaginate', page: 1, search })
      }}
    >
      <input
        type="search"
        className="form-control"
        ref={searchRef}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          if (!e.target.value) {
            dispatch({ type: 'shopsPaginate', page: 1, search: '' })
          }
        }}
        placeholder={`${fbt('Search', 'Search')}...`}
      />
    </form>
  )
}

export default ShopSearch
