import React from 'react'
import fbt from 'fbt'
import { useHistory, useLocation } from 'react-router-dom'
import queryString from 'query-string'

const SortBy = ({ className }) => {
  const location = useLocation()
  const history = useHistory()
  const opts = queryString.parse(location.search)
  return (
    <select
      className={className}
      value={opts.sort || 'manual'}
      onChange={(e) => {
        const sort = e.target.value
        history.replace({
          pathname: location.pathname,
          search: sort === 'manual' ? null : `?sort=${sort}`
        })
      }}
    >
      <option value="manual">
        <fbt desc="component.SortBy.featured">Sort by: Featured</fbt>
      </option>
      <option value="title-ascending">
        <fbt desc="component.SortBy.titleAsc">Sort by: Title, A-Z</fbt>
      </option>
      <option value="title-descending">
        <fbt desc="component.SortBy.titleDesc">Sort by: Title, Z-A</fbt>
      </option>
      <option value="price-ascending">
        <fbt desc="component.SortBy.priceAsc">Sort by: Price, low to high</fbt>
      </option>
      <option value="price-descending">
        <fbt desc="component.SortBy.priceDesc">Sort by: Price, high to low</fbt>
      </option>
    </select>
  )
}
export default SortBy
