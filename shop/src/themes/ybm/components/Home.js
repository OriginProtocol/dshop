import React, { useState, useEffect } from 'react'
import { HashRouter, Switch, Route } from 'react-router-dom'
import get from 'lodash/get'

import useConfig from 'utils/useConfig'

import Link from 'components/Link'
import DisplayPolicy from 'components/DisplayShopPolicy'

import useThemeVars from 'utils/useThemeVars'

import Header from './_Header'
import Footer from './_Footer'
import Collections from './_Collections'

const Home = () => {
  const { config } = useConfig()
  const themeVars = useThemeVars()
  const [policies, setPolicies] = useState([['', '', false]])

  useEffect(() => {
    fetch(`/shop/policies`, {
      method: 'GET',
      headers: {
        authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          return null
        } else {
          return res.json() //Expected type: <Array<Array<String, String, boolean>>>
        }
      })
      .then((result) => {
        if (result) {
          setPolicies(result)
        }
      })
      .catch((err) => {
        console.error('Failed to load shop policies', err)
      })
  }, [window.onload])

  return (
    <>
      <HashRouter>
        <Switch>
          {policies.map((policy, index) => {
            return (
              <Route key={`${index}`} path={`/policy${index + 1}`}>
                <div className="container prose">
                  <DisplayPolicy heading={policy[0]} text={policy[1]} />
                </div>
              </Route>
            )
          })}
        </Switch>
      </HashRouter>
      <Header>
        <div
          className="text-center px-4 mt-24 text-3xl sm:text-5xl leading-tight mx-auto"
          style={{ maxWidth: 600 }}
        >
          {get(themeVars, 'home.headerText', config.byline)}
        </div>
        <div className="text-center pt-12 pb-40 sm:pb-60">
          <Link to="/products" className="btn btn-primary btn-xl">
            Shop Now
          </Link>
        </div>
      </Header>
      <div className="bg-orange-100">
        <div className="container text-gray-600 text-center py-12 sm:py-24 text-lg sm:text-2xl leading-tight font-light">
          {get(themeVars, 'home.aboutText')}
        </div>
      </div>
      <div className="sm:container sm:mt-20 mb-32">
        <Collections limit={4} />
      </div>
      <div className="text-center mb-32">
        <Link to="/products" className="btn btn-secondary btn-xl">
          View All Products
        </Link>
      </div>
      <Footer policyHeadings={policies.map((pol) => pol[0])} />
    </>
  )
}

export default Home
