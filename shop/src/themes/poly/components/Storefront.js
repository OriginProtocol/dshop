import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Home from './Home'
import Product from './Product'
import Cart from './Cart'
import About from './About'

import Header from './_Header'
import Footer from './_Footer'

const Storefront = () => {
  return (
    <>
      <Header />

      <Switch>
        <Route path="/product/:id" component={Product} />
        <Route path="/cart" component={Cart} />
        <Route path="/about" component={About} />
        {/* <Route path="/order" component={Confirmation} /> */}
        <Route component={Home} />
      </Switch>

      <Footer />
    </>
  )
}

export default Storefront
