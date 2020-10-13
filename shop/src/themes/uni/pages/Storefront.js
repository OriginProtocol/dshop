import React from 'react'
import { Switch, Route } from 'react-router-dom'

import Home from './Home'
import Buy from './Buy'
import Sell from './Sell'
import Redeem from './Redeem'
import Checkout from './Checkout'
import Confirmation from './Confirmation'
import Connection from './Connection'
import Stats from './Stats'
import About from './About'

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
          <Route path="/buy" component={Buy} />
          <Route path="/sell" component={Sell} />
          <Route path="/redeem" component={Redeem} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/confirmation" component={Confirmation} />
          <Route path="/connection" component={Connection} />
          <Route path="/stats" component={Stats} />
          <Route path="/about" component={About} />
          <Route component={Home} />
        </Switch>
      </div>

      <Footer />
    </>
  )
}

export default Storefront
