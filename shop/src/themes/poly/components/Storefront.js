import fetch from 'node-fetch'
import React, { useState, useEffect } from 'react'
import { Switch, Route } from 'react-router-dom'

import useConfig from 'utils/useConfig'
import Home from './Home'
import Product from './Product'
import Products from './Products'
import About from './About'
import Cart from '../../shared/Cart'
import DisplayPolicy from 'components/DisplayShopPolicy'

import Header from './_Header'
import Footer from './_Footer'

const Storefront = () => {
  const { config } = useConfig()
  const [policies, setPolicies] = useState([['', '', false]])

  useEffect(() => {
    fetch('/shop/policies', {
      method: 'GET',
      headers: {
        authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`,
        'content-type': 'application/json'
      }
    })
      .then((res) => (!res.ok ? null : res.json())) //Expected type: <Array<Array<String, String, boolean>>>
      .then((result) => (result ? setPolicies(result) : null))
      .catch((err) => console.error('Failed to load shop policies', err))
  }, [window.onload])

  return (
    <>
      <Header />

      <Switch>
        <Route path="/products" component={Products} />
        <Route path="/product/:id" component={Product} />
        <Route path="/cart" component={Cart} />
        <Route path="/about" component={About} />
        {policies.map((policy, index) => {
          return (
            <Route key={index} path={`/policy${index + 1}`}>
              <div className="container prose">
                <DisplayPolicy heading={policy[0]} text={policy[1]} />
              </div>
            </Route>
          )
        })}
        <Route component={Home} />
      </Switch>

      <Footer policyHeadings={policies.map((p) => p[0])} />
    </>
  )
}

export default Storefront
