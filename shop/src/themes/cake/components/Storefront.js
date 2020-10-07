import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Home from './Home'
import Product from './Product'
import Products from './Products'
import Contact from './Contact'
import About from './About'
import Cart from '../../shared/Cart'

import Header from './_Header'
import Footer from './_Footer'

const Storefront = () => {
  return (
    <>
      <Header />

      <Switch>
        <Route path="/products/:collection?" component={Products} />
        <Route path="/product/:id" component={Product} />
        <Route path="/contact" component={Contact} />
        <Route path="/cart" component={Cart} />
        <Route path="/about" component={About} />
        <Route component={Home} />
      </Switch>

      <Footer />
    </>
  )
}

export default Storefront
