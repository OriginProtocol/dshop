import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'

import './app.css'

import DshopProvider from 'components/DshopProvider'

import Home from './components/Home'
import Products from './components/Products'
import Product from './components/Product'
import Contact from './components/Contact'
import Cart from './components/Cart'
import About from './components/About'
import Confirmation from './components/Confirmation'
import Checkout from './components/checkout/Checkout'

const Providers = () => (
  <HashRouter>
    <DshopProvider>
      <Switch>
        <Route path="/products" component={Products} />
        <Route path="/product/:id" component={Product} />
        <Route path="/contact" component={Contact} />
        <Route path="/cart" component={Cart} />
        <Route path="/about" component={About} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order" component={Confirmation} />
        <Route component={Home} />
      </Switch>
    </DshopProvider>
  </HashRouter>
)

ReactDOM.render(<Providers />, document.getElementById('app'))
