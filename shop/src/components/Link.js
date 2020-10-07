import React from 'react'
import { Link, NavLink } from 'react-router-dom'

const ScrollToTopLink = ({ useNavLink, ...props }) => {
  let { to } = props
  if (typeof to === 'string') {
    to = { pathname: to, state: { scrollToTop: true } }
  }
  if (useNavLink) {
    return <NavLink {...props} to={to} />
  }
  return <Link {...props} to={to} />
}

export default ScrollToTopLink
