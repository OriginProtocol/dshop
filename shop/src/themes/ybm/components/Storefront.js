import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Product from './Product'
import Products from './Products'
// import Contact from './Contact'
import Cart from '../../shared/Cart'

import Header from './_Header'
import Footer from './_Footer'

const Storefront = () => {
  return (
    <>
      <Header />

      <Switch>
        <Route path="/products" component={Products} />
        <Route path="/product/:id" component={Product} />
        {/* <Route path="/contact" component={Contact} /> */}
        <Route path="/cart" component={Cart} />
      </Switch>

      <Footer />
    </>
  )
}

export default Storefront
