import React from 'react'
import fbt from 'fbt'

import Link from 'components/Link'

const PrintfulShippingAlert = () => {
  return (
    <div className="shipping-settings">
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="Shipping">Shipping</fbt>
      </h3>
      <div className="printful-shipping-alert">
        <img src="images/printful.svg" />
        <div>
          <fbt desc="admin.settings.shipping.printfulRates">
            Rates are automatically calculated by Printful
          </fbt>
        </div>
      </div>
    </div>
  )
}

export default PrintfulShippingAlert

require('react-styl')(`
  .printful-shipping-alert
    border-radius: 5px
    border: solid 1px #cdd7e0
    background-color: #ffffff
    display: flex
    align-items: center
    padding: 2rem
    font-family: Lato;
    font-size: 16px;  

    img
      width: 86px
      object-fit: contain
      flex: auto 0 0
      margin-right: 2.5rem
`)
