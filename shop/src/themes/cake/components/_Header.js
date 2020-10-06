import React, { useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import get from 'lodash/get'

import { useStateValue } from 'data/state'
import useConfig from 'utils/useConfig'
import useCollections from 'utils/useCollections'

import Link from 'components/Link'
import CartIcon from 'components/icons/Cart'
import MenuIcon from 'components/icons/Menu'

const Cart = ({ cart, hideText }) => (
  <Link
    to="/cart"
    className="btn btn-primary nav-link flex items-center text-sm px-6 py-1"
  >
    <CartIcon className="w-4 mr-2 fill-current" fill={null} />
    {hideText ? null : 'Cart'}
    {cart.items.length ? <div className="ml-2">{cart.items.length}</div> : null}
  </Link>
)

const Header = ({ bg }) => {
  const history = useHistory()
  const [mobileMenu, showMobileMenu] = useState(false)
  const [{ cart }] = useStateValue()
  const { config } = useConfig()
  const { collections } = useCollections()

  const logoUrl = get(config, 'theme.logoUrl')
  const featuredCollectionIds = get(config, 'theme.featuredCollections', [])
  const featuredCollections = useMemo(() => {
    return featuredCollectionIds
      .map((cId) => collections.find((c) => c.id === cId))
      .filter((c) => Boolean(c))
  }, [featuredCollectionIds, collections])

  function toggleMobileMenu() {
    const body = document.querySelector('body')
    if (mobileMenu) {
      body.style.removeProperty('overflow')
    } else {
      body.style.overflow = 'hidden'
    }
    showMobileMenu(!mobileMenu)
  }

  const content = (
    <div className="container flex flex-row justify-between items-center">
      <Link to="/">
        <img style={{ width: 120 }} src={logoUrl} />
      </Link>
      <div className="flex flex-row text-sm items-center">
        <Link
          className="hidden md:block mr-8 pb-1"
          to="/about"
          useNavLink
          exact
          activeClassName="text-red-400"
        >
          About
        </Link>
        <Link
          className="hidden md:block mr-8 pb-1"
          to="/products"
          useNavLink
          exact
          activeClassName="text-red-400"
        >
          All Products
        </Link>
        {featuredCollections.map((collection) => {
          return (
            <Link
              className="hidden md:block mr-8 pb-1"
              to={`/products/${collection.id}`}
              key={collection.id}
              useNavLink
              exact
              activeClassName="text-red-400"
            >
              {collection.title}
            </Link>
          )
        })}
      </div>
      <a
        className="sm:hidden mr-6"
        href="#"
        onClick={(e) => {
          e.preventDefault()
          toggleMobileMenu()
        }}
      >
        <MenuIcon color={bg ? '#fff' : '#000'} />
      </a>
      <div className="flex">
        <Cart cart={cart} bg={bg} />
      </div>
    </div>
  )

  return (
    <>
      <div className="py-12 sm:py-20">{content}</div>
      {!mobileMenu ? null : (
        <div
          className="fixed inset-0 bg-white p-12"
          onClick={() => showMobileMenu(false)}
        >
          <div className="flex justify-between items-center">
            <Close />
            <div className="text-2xl font-medium">Bite Desserts</div>
            <Cart cart={cart} hideText />
          </div>
          <ul className="flex flex-col text-3xl items-center font-medium mt-12">
            <li
              className="pb-4"
              onClick={() => {
                showMobileMenu(false)
                history.push('/products')
              }}
            >
              All Products
            </li>
            {featuredCollections.map((collection) => {
              return (
                <li
                  className="pb-4"
                  onClick={() => {
                    showMobileMenu(false)
                    history.push(`/products/${collection.id}`)
                  }}
                  key={collection.id}
                >
                  {collection.title}
                </li>
              )
            })}
            <li
              className="pb-4"
              onClick={() => {
                showMobileMenu(false)
                history.push('/about')
              }}
            >
              About
            </li>
            <li
              className="pb-4"
              onClick={() => {
                showMobileMenu(false)
                history.push('/contact')
              }}
            >
              Contact
            </li>
          </ul>
        </div>
      )}
    </>
  )
}

const Close = () => (
  <svg width="18" height="18">
    <line x1="1" y1="17" x2="17" y2="1" strokeWidth="4" stroke="#000" />
    <line x1="1" y1="1" x2="17" y2="17" strokeWidth="4" stroke="#000" />
  </svg>
)

export default Header
