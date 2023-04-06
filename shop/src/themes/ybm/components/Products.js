import React, { useState, useEffect } from 'react'
import { useRouteMatch, useHistory } from 'react-router-dom'
import get from 'lodash/get'

import useCollections from 'utils/useCollections'
import useSearchQuery from 'utils/useSearchQuery'
import useThemeVars from 'utils/useThemeVars'
import useConfig from 'utils/useConfig'

import SortBy from 'components/SortBy'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'
import { getPolicies } from './Policies'

const AllProducts = () => {
  const history = useHistory()
  const themeVars = useThemeVars()
  const { visibleCollections } = useCollections({ includeAll: 'All Products' })
  const match = useRouteMatch('/collections/:collection')
  const opts = useSearchQuery()
  const collection = get(match, 'params.collection')

  const { config } = useConfig()
  const [policyHeadings, setHeadings] = useState([''])
  useEffect(() => {
    const updatePolicies = async () => {
      getPolicies(config.backendAuthToken).then((obj) => {
        setHeadings(obj.policyHeads)
      })
    }

    updatePolicies()
  }, [])

  return (
    <>
      <Header>
        <div className="container text-center text-lg sm:text-2xl pt-8 sm:pt-16 pb-16 sm:pb-40 max-w-4xl">
          {get(themeVars, 'products.headerText')}
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
      <Footer policyHeadings={policyHeadings} />
    </>
  )
}

export default AllProducts
