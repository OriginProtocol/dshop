import React, { useEffect } from 'react'
import { Switch, Route, withRouter, useHistory } from 'react-router-dom'
import get from 'lodash/get'
import queryString from 'query-string'

import fbt from 'fbt'

import Storefront from './Storefront'
import Admin from './admin/Admin'
import SuperAdmin from './super-admin/SuperAdmin'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'

window.dataLayer = window.dataLayer || []
const gtag = function () {
  window.dataLayer.push(arguments)
}
window.gtag = gtag

const App = ({ location }) => {
  const history = useHistory()
  const { setActiveShop, config, error } = useConfig()
  const [{ admin, affiliate }, dispatch] = useStateValue()
  const q = queryString.parse(location.search)
  const gaTag = get(admin, 'network.googleAnalytics')
  const gaMerchantTag = get(config, 'gaCode')

  const isSuperAdmin = location.pathname.indexOf('/super-admin') === 0
  const isAdmin = location.pathname.indexOf('/admin') === 0 || isSuperAdmin

  // Redirect to HTTPS if URL is not local
  useEffect(() => {
    const href = window.location.href
    if (
      href.match(/^http:/) &&
      !href.match(/^http:\/\/([a-z0-9.-]*localhost|([0-9]+\.))/)
    ) {
      window.location.href = window.location.href.replace('http:', 'https:')
    }
  }, [])

  // Record affiliate
  useEffect(() => {
    if (q.r) {
      dispatch({ type: 'setReferrer', referrer: q.r })
      delete q.r
      const search = queryString.stringify(q)
      history.replace({ pathname: location.pathname, search })
    }
  }, [location, affiliate])

  useEffect(() => {
    if (location.state && location.state.scrollToTop) {
      window.scrollTo(0, 0)
    }
    if (gaTag && isAdmin) {
      gtag('config', gaTag, { page_path: location.pathname })
    } else if (gaMerchantTag) {
      gtag('config', gaMerchantTag, { page_path: location.pathname })
    }
  }, [location.pathname])

  // Add custom CSS
  useEffect(() => {
    if (config) {
      const customCss = isAdmin ? '' : config.css || ''
      const existingCss = document.querySelector('#custom-css')
      if (existingCss) {
        existingCss.textContent = customCss
      } else {
        const cssEl = document.createElement('style')
        cssEl.id = 'custom-css'
        cssEl.appendChild(document.createTextNode(customCss))
        document.head.appendChild(cssEl)
      }
      const favicon = document.querySelector('link[rel="icon"]')
      if (config.favicon) {
        favicon.href = `${config.dataSrc}${config.favicon}`
      } else {
        favicon.href = 'FAVICON'
      }
    }
    if (document.title === 'TITLE') {
      document.title = fbt('Origin Dshop', 'OriginDshop')
    }
  }, [config])

  useEffect(() => {
    if (!config) {
      setActiveShop(true)
    }
  }, [config])

  useEffect(() => {
    const gaCode = isAdmin ? gaTag : gaMerchantTag
    if (gaCode) {
      const gaEl = document.createElement('script')
      gaEl.async = 'async'
      gaEl.src = `https://www.googletagmanager.com/gtag/js?id=${gaCode}`
      document.head.appendChild(gaEl)
      gtag('js', new Date())
      gtag('set', 'transport', 'beacon')
      gtag('config', gaCode, { page_path: location.pathname })
    }
  }, [gaTag, gaMerchantTag])

  if (!config) {
    return null
  }

  if (get(admin, 'setup')) {
    return <SuperAdmin />
  } else if (
    error ||
    (get(config, 'firstTimeSetup') && !get(admin, 'superuser'))
  ) {
    return <Admin />
  }

  return (
    <Switch>
      <Route path="/admin" component={Admin}></Route>
      <Route path="/super-admin" component={SuperAdmin}></Route>
      <Route component={Storefront}></Route>
    </Switch>
  )
}

export default withRouter(App)

require('react-styl')(`
  body
    color: #333
    font-family: "Lato"
  a
    color: #333
    &:hover,&:focus
      color: #333
      text-decoration: none
  .fixed-loader
    position: fixed
    left: 50%
    top: 50%
    font-size: 2rem
    transform: translate(-50%, -50%)
  .invalid-feedback
    word-break: break-word
  .btn-rounded
    border-radius: 10rem
    padding-left: 1rem
    padding-right: 1rem
`)
