import React from 'react'
import get from 'lodash/get'
import fbt from 'fbt'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import useConfig from 'utils/useConfig'
import usePGP from 'utils/usePGP'
import Contact from './_Contact'
import ShipTo from './_ShipTo'
import ChoosePayment from './ChoosePayment'
import BetaWarning from './_BetaWarning'

const CheckoutPayment = () => {
  const { config } = useConfig()
  const [{ cart }] = useStateValue()
  usePGP()

  return (
    <div className="checkout-shipping">
      <div className="d-none d-md-block">
        <h3>{config.fullTitle}</h3>
        <div className="breadcrumbs">
          <Link to="/cart">
            <fbt desc="Cart">Cart</fbt>
          </Link>
          <Link to="/checkout">
            <fbt desc="Information">Information</fbt>
          </Link>
          <Link to="/checkout/shipping">
            <fbt desc="Shipping">Shipping</fbt>
          </Link>
          <span>
            <fbt desc="Payment">Payment</fbt>
          </span>
        </div>
      </div>
      <div className="checkout-review-info">
        <Contact />
        <ShipTo />
        <div className="info-row">
          <div className="label">
            <fbt desc="Method">Method</fbt>
          </div>
          <div className="value">{get(cart, 'shipping.label')}</div>
          <Link className="change" to="/checkout/shipping">
            <fbt desc="Change">Change</fbt>
          </Link>
        </div>
      </div>
      <div className="mt-4 mb-3">
        <b>
          <fbt desc="Payment">Payment</fbt>
        </b>
        <div>
          <fbt desc="checkout.payment.secureTx">
            All transactions are secure and encrypted
          </fbt>
        </div>
      </div>
      <ChoosePayment />
      <BetaWarning />
    </div>
  )
}

export default CheckoutPayment
