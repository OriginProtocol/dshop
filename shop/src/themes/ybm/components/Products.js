import React from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import useCollections from 'utils/useCollections'
import useSearchQuery from 'utils/useSearchQuery'
import useConfig from 'utils/useConfig'

import SortBy from 'components/SortBy'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'

const AllProducts = () => {
  const { config } = useConfig()
  const history = useHistory()
  const { visibleCollections } = useCollections({ includeAll: 'All Products' })
  const match = useRouteMatch('/collections/:collection')
  const opts = useSearchQuery()
  const collection = get(match, 'params.collection')

  return (
    <>
      <Header>
        <div className="container text-center text-lg sm:text-2xl pt-8 sm:pt-16 pb-16 sm:pb-40 max-w-4xl">
          {get(config, 'theme.products.header')}
        </div>
      </Header>
      <div className="container grid my-12 sm:my-20 gap-8 sm:gap-32 text-sm justify-center grid-flow-row sm:grid-flow-col">
        <select
          value={collection}
          onChange={(e) => {
            const products = e.target.value === 'all' ? '/products' : ''
            history.push(products || `/collections/${e.target.value}`)
          }}
        >
          {visibleCollections.map((c) => (
            <option key={c.id} value={c.id}>
              {`Category: ${c.title}`}
            </option>
          ))}
        </select>
        <SortBy />
      </div>
      <div className="sm:container mb-12">
        <Products collection={collection} sort={opts.sort} />
      </div>
      <Footer />
    </>
  )
}

export default AllProducts
