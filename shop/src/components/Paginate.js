import React from 'react'
import range from 'lodash/range'

import { useHistory, useLocation } from 'react-router-dom'
import queryString from 'query-string'

import usePaginate from 'utils/usePaginate'

const Item = ({ disabled, onClick, children, active }) => {
  let className = 'page-item'
  if (disabled) className += ' disabled'
  if (active) className += ' active'
  return (
    <li className={className}>
      <a
        className="page-link"
        href="#"
        onClick={(e) => {
          e.preventDefault()
          if (onClick) onClick()
        }}
        children={children}
      />
    </li>
  )
}

const Paginate = ({ total, perPage, onChange, page }) => {
  const history = useHistory()
  const location = useLocation()
  const opts = queryString.parse(location.search)
  const { page: pageParam, perPage: perPageDefault } = usePaginate()
  const perPageVal = perPage || perPageDefault
  const pages = Math.ceil(total / perPageVal)

  if (!page) {
    page = pageParam
  }

  if (!total || !pages || pages <= 1) return null

  const hasPrevious = page > 1
  const hasNext = page < pages

  function handlePage(newPage) {
    if (onChange) {
      onChange(newPage)
    } else {
      history.push({
        pathname: location.pathname,
        search: queryString.stringify({
          ...opts,
          page: newPage === 1 ? undefined : newPage
        })
      })
    }
    window.scrollTo(0, 0)
  }

  let start = page > 4 ? Math.max(page - 1, 1) : 1
  let end = page > 4 ? Math.min(page + 2, pages + 1) : 6
  if (page > pages - 4) {
    start = pages - 4
    end = pages + 1
  }

  let prefix, postfix
  if (pages > 7) {
    if (page >= 5) {
      prefix = (
        <>
          <Item onClick={() => handlePage(1)}>{1}</Item>
          <Item disabled={true}>&hellip;</Item>
        </>
      )
    }
    if (page < pages - 3) {
      postfix = (
        <>
          <Item disabled={true}>&hellip;</Item>
          <Item onClick={() => handlePage(pages)}>{pages}</Item>
        </>
      )
    }
  } else {
    start = 1
    end = pages + 1
  }

  return (
    <div className="d-flex justify-content-center">
      <ul className="pagination">
        <Item
          disabled={!hasPrevious}
          onClick={page > 1 ? () => handlePage(page - 1) : null}
          children={<>&laquo;</>}
        />
        {prefix}
        {range(start, end).map((i) => (
          <Item
            key={i}
            active={page === i}
            onClick={page !== i ? () => handlePage(i) : null}
            children={i}
          />
        ))}
        {postfix}
        <Item
          disabled={!hasNext}
          onClick={hasNext ? () => handlePage(page + 1) : null}
          children={<>&raquo;</>}
        />
      </ul>
    </div>
  )
}

export default Paginate

require('react-styl')(`
  .pagination
    display: inline-grid
    grid-auto-flow: column
    grid-auto-columns: 1fr
    text-align: center
`)
