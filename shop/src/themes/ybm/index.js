import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'

import './app.css'

import DshopProvider from 'components/DshopProvider'
import PreviewBanner from 'components/PreviewBanner'

import Cart from './components/Cart'
import Home from './components/Home'
import About from './components/About'
import Contact from './components/Contact'
import Products from './components/Products'
import Product from './components/Product'
import Confirmation from '../shared/Confirmation'
import Checkout from '../shared/checkout/Loader'

const Providers = () => {
  return (
    <HashRouter>
      <DshopProvider>
        <PreviewBanner
          wrapperClassName="bg-black text-white text-sm py-2"
          className="container flex justify-between"
        />
        <Switch>
          <Route path="/checkout" component={Checkout} />
          <Route path="/order" component={Confirmation} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/products" component={Products} />
          <Route path="/product/:id" component={Product} />
          <Route
            path="/collections/:collection/product/:id"
            component={Product}
          ></Route>
          <Route path="/collections/:collection" component={Products} />
          <Route path="/cart" component={Cart} />
          <Route path="/" component={Home} />
        </Switch>
      </DshopProvider>
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
