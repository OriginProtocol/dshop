import React, { useState, useEffect } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import useIsMobile from 'utils/useIsMobile'
import useConfig from 'utils/useConfig'

import Bars from 'components/icons/Bars.js'
import Link from 'components/Link'

import Nav from './_Nav'
import Notice from './_Notice'
import Categories from './_Categories'
import MobileMenu from './_MobileMenu'
import Products from './Products'
import Product from './Product'
import About from './About'
import Terms from './Terms'
import Footer from './_Footer'
import Affiliates from './affiliates/Affiliates'
import Cart from './cart/Cart'

import fbt from 'fbt'

const Content = () => {
  const { config } = useConfig()

  useEffect(() => {
    if (!window.BroadcastChannel) {
      return
    }
    const bc = new BroadcastChannel('dshop')

    bc.onmessage = function msg(ev) {
      if (ev.data === 'reload') {
        window.location.reload()
      }
    }
    return function cleanup() {
      bc.close()
    }
  }, [])

  const Routes = (
    <Switch>
      <Route path="/products/:id" component={Product} />
      <Route path="/cart" component={Cart} />
      <Route path="/search" component={Products} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={Terms} />
      {!config.affiliates ? null : (
        <Route path="/affiliates" component={Affiliates} />
      )}
      {!config.singleProduct ? null : (
        <Redirect to={`/products/${config.singleProduct}`} />
      )}
      <Route
        path="/collections/:collection/products/:id"
        component={Product}
      ></Route>
      <Route path="/collections/:collection" component={Products} />
      <Route component={Products} />
    </Switch>
  )

  return (
    <main>
      {config.singleProduct || config.isAffiliate ? (
        Routes
      ) : (
        <div className="row">
          <div className="col-md-3">
            <Categories />
          </div>
          <div className="col-md-9">{Routes}</div>
        </div>
      )}
    </main>
  )
}

const Main = () => {
  const { config } = useConfig()
  const isMobile = useIsMobile()
  const [menu, setMenu] = useState(false)
  if (!config) {
    return (
      <div className="mt-5 text-center">
        <fbt desc="pages.Main.ConfigNotFound">Site configuration not found</fbt>
      </div>
    )
  }
  if (isMobile) {
    return (
      <>
        <Notice />
        <div className="container">
          <header>
            <Link to="/" onClick={() => setMenu(false)}>
              <h1>
                {config.logo ? (
                  <img src={`${config.dataSrc}${config.logo}`} />
                ) : null}
                {config.title}
              </h1>
            </Link>
            <button className="btn" onClick={() => setMenu(!menu)}>
              <Bars />
            </button>
          </header>
          <MobileMenu open={menu} onClose={() => setMenu(false)} />
          <Content />
        </div>
        <Notice footer={true} />
        <Footer />
      </>
    )
  }
  return (
    <>
      <div className="app-wrap">
        <Notice />
        <Nav />
        <div className="container">
          <header>
            <Link to="/">
              <h1>
                {config.logo ? (
                  <img src={`${config.dataSrc}${config.logo}`} />
                ) : null}
                {config.title}
              </h1>
            </Link>
            {!config.byline ? null : (
              <div dangerouslySetInnerHTML={{ __html: config.byline }} />
            )}
          </header>
          <Content />
        </div>
        <Notice footer={true} />
      </div>
      <Footer />
    </>
  )
}

export default Main

require('react-styl')(`
  #app
    display: flex
    flex-direction: column
    min-height: 100vh
  .app-wrap
    flex: 1 0 auto
  .footer
    flex-shrink: 0
  header
    display: flex
    align-items: center
    justify-content: space-between
    margin-top: 2rem
    margin-bottom: 2rem
    flex-wrap: wrap
    > a
      color: #000
    h1
      display: flex
      font-size: 38px
      font-weight: 300
      align-items: center
      margin: 0
      svg,img
        width: 12rem
        margin-right: 1rem

  main
    min-height: 5rem

  .breadcrumbs
    margin-bottom: 1.5rem
    a,span
      &:after
        content: "›"
        padding: 0 0.25rem
      &:last-child:after
        content: ""

  @media (max-width: 767.98px)
    body
      border-top: 5px solid black
    header
      margin-top: 1rem
      margin-bottom: 1rem
      flex-wrap: nowrap
      .icon-bars
        width: 2rem
      h1
        margin: 0
        font-weight: 300
        font-size: 2rem
        svg,img
          width: 1.5rem
          margin-right: 0.75rem
`)
