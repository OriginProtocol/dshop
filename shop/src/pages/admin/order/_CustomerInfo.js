import React from 'react'

import get from 'lodash/get'
import dayjs from 'dayjs'

import formatAddress from 'utils/formatAddress'

const CustomerInfo = ({ order }) => {
  const cart = get(order, 'data')
  const userInfo = get(order, 'data.userInfo')
  if (!userInfo) {
    return <div>Loading...</div>
  }

  const phone = get(cart, 'userInfo.phone')

  return (
    <div className="customer-info">
      <div>
        <div>Date</div>
        <div>{dayjs(order.createdAt).format('MMM D, h:mm A')}</div>
      </div>
      <div>
        <div>Contact Info</div>
        <div>
          <div>{get(userInfo, 'email')}</div>
          <div>{!phone ? null : `☎ ${phone}`}</div>
        </div>
      </div>
      <div>
        <div>Payment Method</div>
        <div>{get(cart, 'paymentMethod.label')}</div>
      </div>
      <div>
        <div>Shipping Method</div>
        <div>{get(cart, 'shipping.label')}</div>
      </div>
      <div>
        <div>Shipping Address</div>
        <div>
          {formatAddress(userInfo).map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
      <div>
        <div>Billing Address</div>
        <div>
          {userInfo.billingDifferent
            ? formatAddress(userInfo, 'billing').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))
            : 'Same as shipping address'}
        </div>
      </div>
    </div>
  )
}

export default CustomerInfo

require('react-styl')(`
  .customer-info
    > div
      display: flex
      > div
        flex: 1
        margin-right: 1.5rem
        padding: 1rem
        &:first-child
          font-weight: bold
      &:nth-child(even)
        background-color: #fafbfc
`)
