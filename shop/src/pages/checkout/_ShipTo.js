import React from 'react'
import fbt from 'fbt'
import { useStateValue } from 'data/state'

import Link from 'components/Link'

const CheckoutContact = () => {
  const [{ cart }] = useStateValue()
  const { userInfo } = cart
  if (!userInfo) {
    return null
  }
  const { address1, city, zip, country } = userInfo

  const province = userInfo.province ? `${userInfo.province} ` : ''

  return (
    <div className="info-row">
      <div className="label">
        <fbt desc="checkout.shipping.shipTo">Ship to</fbt>
      </div>
      <div className="value">
        {`${address1}, ${city}, ${province}${zip}, ${country}`}
      </div>
      <Link className="change" to="/checkout">
        <fbt desc="Change">Change</fbt>
      </Link>
    </div>
  )
}

export default CheckoutContact
