import React from 'react'
import fbt from 'fbt'
import { useStateValue } from 'data/state'

import Link from 'components/Link'

const CheckoutContact = () => {
  const [{ cart }] = useStateValue()
  const { userInfo } = cart
  if (!userInfo) return null

  return (
    <div className="info-row">
      <div className="label">
        <fbt desc="Contact">Contact</fbt>
      </div>
      <div className="value">{userInfo.email}</div>
      <Link className="change" to="/checkout">
        <fbt desc="Change">Change</fbt>
      </Link>
    </div>
  )
}

export default CheckoutContact
