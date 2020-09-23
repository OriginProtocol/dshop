import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Switch, Route } from 'react-router-dom'

import './app.css'

import { StateProvider } from 'data/state'
import setLocale from 'utils/setLocale'

import ConfigLoader from 'components/ConfigLoader'
import Home from './components/Home'
import Products from './components/Products'
import Product from './components/Product'
import Contact from './components/Contact'
import Cart from './components/Cart'
import About from './components/About'
import Confirmation from './components/Confirmation'
import Checkout from './components/checkout/Checkout'

const Providers = () => {
  useEffect(() => {
    setLocale()
  }, [])

  return (
    <HashRouter>
      <StateProvider>
        <ConfigLoader>
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
        </ConfigLoader>
      </StateProvider>
    </HashRouter>
  )
}

ReactDOM.render(<Providers />, document.getElementById('app'))
