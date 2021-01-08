import React from 'react'

import fbt from 'fbt'

import get from 'lodash/get'
import dayjs from 'dayjs'

import formatAddress from 'utils/formatAddress'

const CustomerInfo = ({ order }) => {
  const cart = get(order, 'data')
  const userInfo = get(order, 'data.userInfo')
  if (!userInfo) {
    return (
      <div>
        <>
          <fbt desc="Loading">Loading</fbt>...
        </>
      </div>
    )
  }

  const phone = get(cart, 'userInfo.phone')

  return (
    <div className="admin-customer-info">
      <div>
        <div>
          <fbt desc="Date">Date</fbt>
        </div>
        <div>{dayjs(order.createdAt).format('MMM D, h:mm A')}</div>
      </div>
      <div>
        <div>
          <fbt desc="admin.orders.contactInfo">Contact Info</fbt>
        </div>
        <div>
          <div>{get(userInfo, 'email')}</div>
          <div>{!phone ? null : `☎ ${phone}`}</div>
        </div>
      </div>
      <div>
        <div>
          <fbt desc="PaymentMethod">Payment Method</fbt>
        </div>
        <div>{get(cart, 'paymentMethod.label')}</div>
      </div>
      <div>
        <div>
          <fbt desc="ShippingMethod">Shipping Method</fbt>
        </div>
        <div>{get(cart, 'shipping.label')}</div>
      </div>
      <div>
        <div>
          <fbt desc="ShippingAddress">Shipping Address</fbt>
        </div>
        <div>
          {formatAddress(userInfo).map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
      <div>
        <div>
          <fbt desc="BillingAddress">Billing Address</fbt>
        </div>
        <div>
          {userInfo.billingDifferent
            ? formatAddress(userInfo, 'billing').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))
            : fbt(
                'Same as shipping address',
                'checkout.payment.sameBillingAddress'
              )}
        </div>
      </div>
    </div>
  )
}

export default CustomerInfo

require('react-styl')(`
  .admin-customer-info
    display: grid
    grid-template-columns: auto auto
    > div
      display: contents
      > div
        padding: 1rem 1rem 1rem 0
        &:first-child
          font-weight: bold
          padding-left: 1rem
        &:nth-child(2)
          word-break: break-all
      &:nth-child(even) > div
        background-color: #fafbfc
`)
