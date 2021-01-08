import React from 'react'
import { Link, NavLink } from 'react-router-dom'

const ScrollToTopLink = ({ useNavLink, scrollToTop = true, ...props }) => {
  let { to } = props
  if (typeof to === 'string') {
    to = { pathname: to, state: { scrollToTop } }
  }
  if (useNavLink) {
    return <NavLink {...props} to={to} />
  }
  return <Link {...props} to={to} />
}

export default ScrollToTopLink
