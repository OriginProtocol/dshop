import React from 'react'
import { useRouteMatch } from 'react-router-dom'
import get from 'lodash/get'
import dayjs from 'dayjs'
import fbt from 'fbt'

import useOfferData from 'utils/useOfferData'
import usePrice from 'utils/usePrice'

function status(id) {
  if (id === 1) return 'Created'
  if (id === 2) return 'Accepted'
  if (id === 3) return 'Disputed'
  else return id
}

const AdminContract = () => {
  const match = useRouteMatch('/admin/orders/:offerId')
  const { offerId } = match.params
  const { sellerProxy, listing, offer } = useOfferData(offerId)
  const { toFiatPrice } = usePrice()

  if (!offer) {
    return 'Loading...'
  }

  return (
    <div className="order-details">
      <div className="contract-data">
        <div>
          <fbt desc="Status">Status</fbt>
        </div>
        <div>{status(offer.status)}</div>
        {offer.token ? (
          <>
            <div>
              <fbt desc="Value">Value</fbt>
            </div>
            <div>
              {`${offer.value} ${offer.token.name}`}
              <span className="ml-3">{`$${toFiatPrice(
                offer.value,
                offer.token.name
              )}`}</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <fbt desc="Token">Token</fbt>
            </div>
            <div>{get(offer, 'token.name', offer.currency)}</div>
            <div>
              <fbt desc="Value">Value</fbt>
            </div>
            <div>{offer.value}</div>
          </>
        )}
        <div>
          <fbt desc="Finalizes">Finalizes</fbt>
        </div>
        <div>
          {offer.finalizes < 10000000
            ? fbt(
                `${fbt.param(
                  'finalizeTime',
                  offer.finalizes / 60 / 60 / 24
                )} days after offer is accepted`,
                'admin.orders.finalizeWidnow'
              )
            : dayjs(offer.finalizes * 1000).format('MMM D, h:mm A')}
        </div>
        <div>
          <fbt desc="Buyer">Buyer</fbt>
        </div>
        <div>{offer.buyer}</div>

        {sellerProxy ? (
          <>
            <div>
              <fbt desc="Seller">Seller</fbt>
            </div>
            <div>{sellerProxy.address}</div>
            <div>
              <fbt desc="Proxy">Proxy</fbt>
            </div>
            <div>{listing.seller}</div>
          </>
        ) : (
          <>
            <div>
              <fbt desc="Seller">Seller</fbt>
            </div>
            <div>{listing ? listing.seller : ''}</div>
          </>
        )}
        <div>
          <fbt desc="Arbitrator">Arbitrator</fbt>
        </div>
        <div>{offer.arbitrator}</div>
        <div>
          <fbt desc="Affiliate">Affiliate</fbt>
        </div>
        <div>
          {offer.affiliate.indexOf('0x000000') === 0
            ? fbt('None set', 'NoneSet')
            : offer.affiliate}
        </div>
        <div>
          <fbt desc="Commission">Commission</fbt>
        </div>
        <div>{`${offer.commission} OGN`}</div>
        <div>
          <fbt desc="Refund">Refund</fbt>
        </div>
        <div>{offer.refund}</div>
      </div>
    </div>
  )
}

export default AdminContract

require('react-styl')(`
  .contract-data
    flex: 2
    margin-right: 3rem
    display: grid
    grid-column-gap: 1.5rem
    grid-row-gap: 1.5rem
    grid-template-columns: 5rem 1fr
    > div:nth-child(odd)
      font-weight: 600
`)
