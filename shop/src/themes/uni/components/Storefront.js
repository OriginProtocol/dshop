import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Home from './Home'
import Product from './Product'
import Buy from './Buy'
import Cart from '../../shared/Cart'

import Header from './_Header'
import Footer from './_Footer'

const Storefront = () => {
  return (
    <>
      <Header />

      <div
        className="container mt-16 flex flex-col items-center justify-center"
        style={{ width: 480 }}
      >
        <Switch>
          <Route path="/product/:id" component={Product} />
          <Route path="/cart" component={Cart} />
          <Route path="/buy" component={Buy} />
          <Route component={Home} />
        </Switch>
      </div>

      <Footer />
    </>
  )
}

export default Storefront
