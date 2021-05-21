import React, { createContext, useContext, useReducer } from 'react'
import FlexSearch from 'flexsearch'

import get from 'lodash/get'
import set from 'lodash/set'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'

import { Countries } from '@origin/utils/Countries'

import calculateCartTotal from '@origin/utils/calculateCartTotal'

import 'utils/setLocale'
import fbTrack from './fbTrack'
import getMaxQuantity from '../utils/getMaxQuantity'

const defaultState = {
  products: [],
  collections: [],
  shippingZones: [],
  orders: [],
  ordersPagination: {},
  shops: [],
  shopsPagination: {},
  discounts: [],
  toasts: [],
  reload: {},
  dashboardStats: {},
  deployments: [],
  themes: [],

  // User's preferred currency
  preferredCurrency: '',

  locale: 'en_US',

  cart: {
    items: [],
    instructions: '',
    subTotal: 0,
    discount: 0,
    donation: 0,
    total: 0,
    paymentMethod: {},
    discountObj: {}
  }
}

function getInitialState(activeShop) {
  const key = activeShop && `${activeShop}CartData`
  const initialState = cloneDeep(defaultState)
  initialState.preferredCurrency =
    localStorage.preferredCurrency || initialState.preferredCurrency

  initialState.locale = localStorage.locale || initialState.locale
  try {
    if (key) {
      return {
        ...initialState,
        ...JSON.parse(localStorage[key])
      }
    }
  } catch (e) {
    /* Ignore */
  }
  return initialState
}

/*
function setStorage(storage, data) {
  const randomArray = Array.from(crypto.getRandomValues(new Uint32Array(5)))
  const dataKey = randomArray.map(n => n.toString(36)).join('')

  const d = new Date()
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000)
  const expires = `expires=${d.toUTCString()}`
  document.cookie = `dshopkey=${dataKey};${expires};path=${location.pathname}`

  openpgp
    .encrypt({
      message: openpgp.message.fromText(JSON.stringify(data)),
      passwords: [dataKey]
    })
    .then(data => {
      localStorage[`${storage}Enc`] = data.data
    })
}

function getStorage(storage) {
  const cookies = document.cookie.split('; ').reduce((m, o) => {
    const [k, v] = o.split('=')
    m[k] = v
    return m
  }, {})
  const encryptedData = localStorage[`${storage}CartDataEnc`]
  openpgp.message.readArmored(encryptedData).then(msg => {
    openpgp
      .decrypt({ message: msg, passwords: [cookies.dshopkey] })
      .then(decrypted => {
        console.log(JSON.parse(decrypted.data))
      })
  })
}
*/

const reducer = (state, action) => {
  let newState = cloneDeep(state)

  fbTrack(state, action)
  if (action.type === 'addToCart') {
    const maxQuantity = getMaxQuantity(
      action.product,
      action.variant,
      state.config
    )

    const item = {
      title: action.product.title,
      product: action.product.id,
      options: action.variant.options,
      quantity: action.quantity || 1,
      variant: action.variant.id,
      price: action.variant.price,
      imageUrl: action.variant.imageUrl,
      externalProductId: action.product.externalId,
      externalVariantId: action.variant.externalId,
      restrictShippingTo: action.product.restrictShippingTo,
      nft: action.product.nft,
      maxQuantity
    }
    const { product, variant } = item
    const existingIdx = state.cart.items.findIndex(
      (i) => i.product === product && i.variant === variant
    )
    if (existingIdx >= 0) {
      const quantity = get(newState, `cart.items[${existingIdx}].quantity`)
      const newQuantity = Math.min(quantity + 1, maxQuantity)
      newState = set(
        newState,
        `cart.items[${existingIdx}].quantity`,
        newQuantity
      )
    } else {
      const lastIdx = state.cart.items.length
      newState = set(newState, `cart.items[${lastIdx}]`, item)
    }
    newState = set(newState, 'shippingZones', [])
    newState = set(newState, 'cart.shipping')
    newState = set(newState, 'cart.taxRate')
  } else if (action.type === 'removeFromCart') {
    const items = get(state, 'cart.items').filter(
      (i) => !isEqual(i, action.item)
    )
    newState = set(newState, 'cart.items', items)
    newState = set(newState, 'shippingZones', [])
    newState = set(newState, 'cart.shipping')
    newState = set(newState, 'cart.taxRate')
  } else if (action.type === 'updateCartQuantity') {
    const { quantity } = action
    const idx = get(state, 'cart.items').findIndex((i) =>
      isEqual(i, action.item)
    )
    newState = set(newState, `cart.items[${idx}].quantity`, quantity)
    newState = set(newState, 'shippingZones', [])
    newState = set(newState, 'cart.shipping')
    newState = set(newState, 'cart.taxRate')
  } else if (action.type === 'setCartOutOfStock') {
    const x = get(state, 'cart.items').findIndex((i) => isEqual(i, action.item))
    newState = set(newState, `cart.items[${x}].outOfStock`, true)
  } else if (action.type === 'setProducts') {
    newState = set(newState, `products`, action.products)
    const index = FlexSearch.create()
    action.products.forEach((product) => index.add(product.id, product.title))
    newState = set(newState, `productIndex`, index)
    // const productIds = action.products.map(p => p.id)
    // newState = set(
    //   newState,
    //   'cart.items',
    //   state.cart.items.filter(i => productIds.indexOf(i.product) >= 0)
    // )
  } else if (action.type === 'setCollections') {
    newState = set(newState, `collections`, action.collections)
  } else if (action.type === 'updateCollectionProducts') {
    const idx = newState.collections.findIndex((c) => c.id === action.id)
    if (idx >= 0) {
      newState = set(newState, `collections[${idx}].products`, action.products)
    }
  } else if (action.type === 'setShippingZones') {
    newState = set(newState, `shippingZones`, action.zones)
  } else if (action.type === 'setOrders') {
    newState = set(newState, `orders`, action.orders)
    newState = set(newState, `ordersPagination`, action.pagination)
  } else if (action.type === 'setShops') {
    newState = set(newState, `shops`, action.shops)
    newState = set(newState, `shopsPagination`, action.pagination)
  } else if (action.type === 'shopsPaginate') {
    newState = set(newState, `shopsPagination`, {
      ...state.shopsPagination,
      ...pick(action, ['page', 'search'])
    })
  } else if (action.type === 'setDiscounts') {
    newState = set(newState, `discounts`, action.discounts)
  } else if (action.type === 'setWallet') {
    newState = set(newState, `cart.userInfo.wallet`, action.wallet)
  } else if (action.type === 'updateUserInfo') {
    const data = pick(
      action.info,
      'email',
      'firstName',
      'lastName',
      'phone',
      'address1',
      'address2',
      'city',
      'province',
      'country',
      'zip',
      'wallet',
      'billingDifferent',
      'billingFirstName',
      'billingLastName',
      'billingAddress1',
      'billingAddress2',
      'billingCity',
      'billingProvince',
      'billingCountry',
      'billingZip'
    )
    data.countryCode = get(Countries, `[${data.country}].code`)
    data.provinceCode = get(
      Countries,
      `[${data.country}].provinces[${data.province}].code`
    )
    newState = set(newState, `cart.userInfo`, data)
    newState = set(newState, 'shippingZones', [])
  } else if (action.type === 'updateTaxRate') {
    newState = set(newState, 'cart.taxRate', action.taxRate)
  } else if (action.type === 'updateShipping') {
    const zone = pick(action.zone, 'id', 'label', 'amount')
    newState = set(newState, `cart.shipping`, zone)
  } else if (action.type === 'updatePaymentMethod') {
    newState = set(newState, `cart.paymentMethod`, action.method)
  } else if (action.type === 'updateActiveToken') {
    newState = set(newState, `cart.paymentMethod.token`, action.token)
  } else if (action.type === 'orderComplete') {
    newState = set(newState, 'cart', cloneDeep(defaultState.cart))
  } else if (action.type === 'setAuth') {
    const backendUrl = get(action.auth, 'backendUrl')
    if (backendUrl) {
      newState = set(newState, 'config.backend', backendUrl)
      const dataSrc = get(newState, 'config.dataSrc', '')
      if (dataSrc.indexOf(backendUrl) < 0) {
        newState = set(newState, 'config.dataSrc', `${backendUrl}/${dataSrc}`)
      }
    }
    newState = set(newState, `admin`, action.auth)
  } else if (action.type === 'setPasswordAuthed') {
    newState = set(newState, `passwordAuthed`, action.authed)
  } else if (action.type === 'logout') {
    newState = cloneDeep(defaultState)
  } else if (action.type === 'updateInstructions') {
    newState = set(newState, 'cart.instructions', action.value)
  } else if (action.type === 'setDiscount') {
    newState = set(newState, 'cart.discountObj', action.discount)
  } else if (action.type === 'setDonation') {
    if (String(action.amount).match(/^[0-9]+$/)) {
      newState = set(newState, 'cart.donation', action.amount)
    }
  } else if (action.type === 'removeDiscount') {
    newState = set(newState, 'cart.discountObj', {})
    newState = set(newState, 'cart.discount', 0)
  } else if (action.type === 'setAffiliate') {
    newState = set(newState, 'affiliate', action.affiliate)
  } else if (action.type === 'setReferrer') {
    newState = set(newState, 'referrer', action.referrer)
  } else if (action.type === 'reload') {
    const targets = Array.isArray(action.target)
      ? action.target
      : [action.target]
    targets.forEach((t) => {
      const target = `reload.${t}`
      const reload = get(newState, target, 0)
      newState = set(newState, target, reload + 1)
    })
    if (['products', 'collections'].indexOf(action.target)) {
      newState = set(newState, 'hasChanges', true)
    }
  } else if (action.type === 'setAdminLocation') {
    newState = set(newState, 'adminLocation', action.location)
  } else if (action.type === 'setStorefrontLocation') {
    newState = set(newState, 'storefrontLocation', action.location)
  } else if (action.type === 'setConfig') {
    const activeShop = get(
      action,
      'config.activeShop',
      get(action, 'config.backendAuthToken')
    )
    if (activeShop) {
      localStorage.activeShop = activeShop
    } else {
      delete localStorage.activeShop
    }
    newState = cloneDeep(getInitialState(activeShop))
    newState = set(newState, 'config', action.config)
    const keep = pick(state, [
      'admin',
      'toasts',
      'shops',
      'shopsPagination',
      'reload'
    ])
    newState = { ...newState, ...keep }
    const backendUrl = get(state, 'admin.backendUrl')
    if (backendUrl) {
      newState = set(newState, 'config.backend', backendUrl)
    }
  } else if (action.type === 'setConfigSimple') {
    newState = set(newState, 'config', action.config)
  } else if (action.type === 'toast') {
    newState = set(newState, `toasts[${newState.toasts.length}]`, {
      message: action.message,
      id: +new Date(),
      type: action.style
    })
  } else if (action.type === 'setDashboardStats') {
    newState = set(newState, 'dashboardStats', action.stats)
  } else if (action.type === 'setOfflinePaymentMethods') {
    newState = set(
      newState,
      'config.offlinePaymentMethods',
      action.offlinePaymentMethods
    )
  } else if (action.type === 'setPreferredCurrency') {
    newState = set(newState, 'preferredCurrency', action.currency)
    localStorage.preferredCurrency = action.currency
  } else if (action.type === 'setLocale') {
    newState = set(newState, 'locale', action.locale)
  } else if (action.type === 'setDeployments') {
    newState = set(newState, 'deployments', action.deployments)
  } else if (action.type === 'setThemes') {
    newState = set(newState, 'themes', action.themes)
  }

  newState.preferredCurrency =
    newState.preferredCurrency || get(newState, 'config.currency', 'USD')
  newState.cart.currency = get(newState, 'config.currency', 'USD')

  const cartComputedValues = calculateCartTotal(newState.cart)
  newState.cart.subTotal = cartComputedValues.subTotal
  newState.cart.discount = cartComputedValues.discount
  newState.cart.totalTaxes = cartComputedValues.totalTaxes
  newState.cart.total = cartComputedValues.total

  const activeShop = get(newState, 'config.activeShop')
  if (activeShop) {
    const storeFields = cloneDeep(
      pick(newState, ['cart', 'affiliate', 'referrer'])
    )
    const items = newState.cart.items.map((i) => omit(i, 'outOfStock'))
    set(storeFields, 'cart.items', items)
    localStorage[`${activeShop}CartData`] = JSON.stringify(storeFields)
  }

  // setStorage(key, pick(newState, 'cart'))
  // console.error(action.type, { action, state, newState })
  return cloneDeep(newState)
}

export const StateContext = createContext()

export const StateProvider = ({ children }) => {
  const activeShop =
    localStorage.activeShop ||
    document.querySelector('link[rel="data-dir"]').getAttribute('href')
  const value = useReducer(reducer, getInitialState(activeShop))
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export const useStateValue = () => useContext(StateContext)
