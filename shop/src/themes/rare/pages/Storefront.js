import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Buy from './Buy'
import Sell from './Sell'
import Redeem from './Redeem'
import Checkout from './Checkout'
import Confirmation from './Confirmation'
import Connection from './Connection'
import Stats from './Stats'
import About from './About'
import Product from './Product'
import Landing from './Landing'

import Header from './_Header'
import Footer from './_Footer'

const Storefront = () => {
  return (
    <>
      <Header />

      <Switch>
        <Route path="/buy/confirmation">
          <Confirmation buy />
        </Route>
        <Route path="/buy" component={Buy} />
        <Route path="/sell/confirmation">
          <Confirmation sell />
        </Route>
        <Route path="/sell" component={Sell} />
        <Route path="/redeem/confirmation">
          <Confirmation redeem />
        </Route>
        <Route path="/redeem" component={Redeem} />

        <Route path="/checkout" component={Checkout} />
        <Route path="/connection" component={Connection} />
        <Route path="/stats" component={Stats} />
        <Route path="/about" component={About} />
        <Route path="/product" component={Product} />
        <Route component={Landing} />
      </Switch>

      <Footer />
    </>
  )
}

export default Storefront
