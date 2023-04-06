import React, { useState, useEffect } from 'react'
import { Switch, Route } from 'react-router-dom'
import fetch from 'node-fetch'

import Home from './Home'
import Product from './Product'
import Products from './Products'
import About from './About'
import Cart from '../../shared/Cart'

import Header from './_Header'
import Footer from './_Footer'

import useConfig from 'utils/useConfig'
import DisplayPolicy from 'components/DisplayShopPolicy'

const Storefront = () => {
  const { config } = useConfig()
  const [policies, setPolicies] = useState([['', '', false]])

  //Get the shop's policies from the DB and store it in the component's state. This data is later used in the routing code.
  useEffect(() => {
    fetch(`${config.backend}/shop/policies`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        authorization: `bearer ${encodeURIComponent(config.backendAuthToken)}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          return null
        } else {
          return res.json()
        }
      })
      .then((result) => {
        if (result) {
          setPolicies(result)
        }
      })
      .catch((err) => console.error('Failed to load shop policies', err))
  }, [window.onload])

  return (
    <div className="font-body">
      <Header />

      <Switch>
        <Route path="/products/:collection?" component={Products} />
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
    </div>
  )
}

export default Storefront
